import { useRef, useState } from "react";
import { Button } from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import { useToastError, useToastWarning } from "@/components/Toast";
import { parseCSV } from "@/helpers/commonHelper";
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CSVFieldMapping<TRow extends Record<string, any> = Record<string, any>> = {
    csvKey:     string;
    rowKey:     keyof TRow;
    transform?: (rawValue: string) => any;
};

export type CSVDuplicateConfig<TRow extends Record<string, any> = Record<string, any>> = {
    keys:          (keyof TRow)[];
    label?:        string;
    existingRows?: TRow[];
};

export type CSVPartNumberValidation<TRow extends Record<string, any> = Record<string, any>> = {
    rowKey:      keyof TRow;   // field that holds the raw name from CSV
    resolvedKey: keyof TRow;   // field that will receive the resolved UUID
    validate:    (names: string[]) => Promise<Record<string, { id: any; [key: string]: any }>>;
    onResolved?: (resolvedMap: Record<string, { id: any; [key: string]: any }>) => void;
};

export type CSVUploadButtonProps<TRow extends Record<string, any> = Record<string, any>> = {
    fieldMappings:        CSVFieldMapping<TRow>[];
    onUpload:             (rows: TRow[]) => void;
    createEmptyRow:       () => TRow;
    maxRows?:             number;
    duplicateCheck?:      CSVDuplicateConfig<TRow>;
    partNumberValidation?: CSVPartNumberValidation<TRow>;
    confirmBodyText?:     string;
    confirmHeaderText?:   string;
    buttonLabel?:         string;
    colorScheme?:         string;
    size?:                string;
    isDisabled?:          boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCompositeKey<TRow extends Record<string, any>>(
    row:  TRow,
    keys: (keyof TRow)[]
): string {
    return keys.map(k => String(row[k] ?? "")).join("||");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CSVUploadButton<TRow extends Record<string, any> = Record<string, any>>({
    fieldMappings,
    onUpload,
    createEmptyRow,
    maxRows = 100,
    duplicateCheck,
    partNumberValidation,
    confirmBodyText   = "Are you sure you want to upload this file? Existing rows with data will be kept.",
    confirmHeaderText = "Upload CSV",
    buttonLabel       = "Upload Items",
    colorScheme       = "green",
    size              = "sm",
    isDisabled        = false,
}: CSVUploadButtonProps<TRow>) {
    const toastError   = useToastError();
    const toastWarning = useToastWarning();

    const [fileKey,           setFileKey]           = useState(0);
    const [uploadedFile,      setUploadedFile]      = useState<File | null>(null);
    const [openConfirmation,  setOpenConfirmation]  = useState(false);
    const [isValidating,      setIsValidating]      = useState(false);

    const inputId = useRef(`csv-upload-${uuidv4()}`).current;

    // ── File selected ──────────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setOpenConfirmation(true);
        }
        setFileKey(k => k + 1);
    };

    // ── Confirm upload ─────────────────────────────────────────────────────────

    const handleConfirm = async () => {
        if (!uploadedFile) return;

        const parsedRows: TODO = await parseCSV(uploadedFile);

        if (parsedRows.length > maxRows) {
            toastError({ title: `Uploaded CSV has more than ${maxRows} rows. Max allowed is ${maxRows}.` });
            setOpenConfirmation(false);
            return;
        }

        // ── Map raw CSV rows → typed TRow objects ──────────────────────────────
        let mapped: TRow[] = parsedRows.map((raw: TODO) => {
            const base = createEmptyRow();
            fieldMappings.forEach(({ csvKey, rowKey, transform }) => {
                const rawValue = raw[csvKey] ?? "";
                (base as any)[rowKey] = transform ? transform(rawValue) : rawValue;
            });
            return base;
        });

        // ── Part number validation ─────────────────────────────────────────────
        if (partNumberValidation) {
            const { rowKey, resolvedKey, validate, onResolved } = partNumberValidation;

            // Collect unique raw names from the staging key
            const rawNames = [
                ...new Set(
                    mapped
                        .map(row => String(row[rowKey] ?? "").trim())
                        .filter(Boolean)
                ),
            ];

            if (rawNames.length === 0) {
                toastError({ title: "No valid part numbers found in the uploaded CSV." });
                setOpenConfirmation(false);
                return;
            }

            setIsValidating(true);
            let resolvedMap: Record<string, { id: any; [key: string]: any }> = {};

            try {
                resolvedMap = await validate(rawNames);
            } catch {
                toastError({ title: "Failed to validate part numbers. Please try again." });
                setOpenConfirmation(false);
                return;
            } finally {
                setIsValidating(false);
            }

            // ── Notify parent so it can seed FieldSelect options ──
            onResolved?.(resolvedMap);

            const notFound:  string[] = [];
            const validated: TRow[]   = [];

            mapped.forEach(row => {
                const rawName = String(row[rowKey] ?? "").trim();

                // ── Try exact match first, then case-insensitive ──
                const match =
                    resolvedMap[rawName] ??
                    resolvedMap[rawName.toLowerCase()] ??
                    Object.entries(resolvedMap).find(
                        ([k]) => k.toLowerCase() === rawName.toLowerCase()
                    )?.[1];

                if (match) {
                    // Write resolved UUID into resolvedKey
                    validated.push({ ...row, [resolvedKey]: match.id });
                } else {
                    if (rawName) notFound.push(rawName);
                }
            });

            if (notFound.length > 0) {
                toastWarning({
                    title:       `${notFound.length} part number(s) not found and were skipped`,
                    description: notFound.join(", "),
                });
            }

            if (validated.length === 0) {
                toastError({ title: "No valid part numbers matched. Nothing was uploaded." });
                setOpenConfirmation(false);
                return;
            }

            mapped = validated;
        }

        // ── Duplicate detection ────────────────────────────────────────────────
        if (duplicateCheck) {
            const { keys, label = keys.join(" + "), existingRows = [] } = duplicateCheck;
            const readableKey = (k: string) => k.split("||").join(" + ");

            const seen = new Set<string>(
                existingRows
                    .filter(row => keys.some(k => !!row[k]))
                    .map(row  => buildCompositeKey(row, keys))
            );

            const intraDuplicates = new Set<string>();
            const crossDuplicates = new Set<string>();

            mapped.forEach(row => {
                const hasValue = keys.some(k => !!row[k]);
                if (!hasValue) return;
                const compositeKey = buildCompositeKey(row, keys);
                if (seen.has(compositeKey)) {
                    const isFromExisting = existingRows.some(
                        er => buildCompositeKey(er, keys) === compositeKey
                    );
                    if (isFromExisting) crossDuplicates.add(compositeKey);
                    else                intraDuplicates.add(compositeKey);
                } else {
                    seen.add(compositeKey);
                }
            });

            if (crossDuplicates.size > 0) {
                toastError({
                    title:       `Duplicate ${label} — already exists in the table`,
                    description: [...crossDuplicates].map(readableKey).join(", "),
                });
                setOpenConfirmation(false);
                return;
            }

            if (intraDuplicates.size > 0) {
                toastError({
                    title:       `Duplicate ${label} entries found in the uploaded CSV`,
                    description: "Those are not allowed to add to existing",
                });
                setOpenConfirmation(false);
                return;
            }
        }

        onUpload(mapped);
        setOpenConfirmation(false);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <input
                key={fileKey}
                type="file"
                accept=".csv"
                id={inputId}
                style={{ display: "none" }}
                onChange={handleFileChange}
                disabled={isDisabled}
            />

            <Button
                as="label"
                htmlFor={inputId}
                leftIcon={<LuUpload />}
                colorScheme={colorScheme}
                size={size}
                cursor={isDisabled ? "not-allowed" : "pointer"}
                isDisabled={isDisabled}
                pointerEvents={isDisabled ? "none" : "auto"}
            >
                {buttonLabel}
            </Button>

            <ConfirmationPopup
                isOpen={openConfirmation}
                onClose={() => setOpenConfirmation(false)}
                onConfirm={handleConfirm}
                headerText={confirmHeaderText}
                bodyText={confirmBodyText}
                isLoading={isValidating}
            />
        </>
    );
}

export default CSVUploadButton;