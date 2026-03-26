import { useRef, useState } from "react";
import { Button } from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import { useToastError } from "@/components/Toast";
import { parseCSV } from "@/helpers/commonHelper";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Describes one column mapping:
 *  - `csvKey`    : the column header in the CSV file
 *  - `rowKey`    : the key to assign in the output row object
 *  - `transform` : optional function to convert the raw CSV string value
 *                  (e.g. resolve an ID from an options array)
 */
export type CSVFieldMapping<TRow extends Record<string, any> = Record<string, any>> = {
    csvKey: string;
    rowKey: keyof TRow;
    transform?: (rawValue: string) => any;
};

/**
 * Configures duplicate detection for a set of row keys.
 *
 * - `keys`         : one or more row keys whose combined value forms the uniqueness key.
 *                    Single key   -> ["part_number_id"]
 *                    Composite    -> ["part_number_id", "condition_id"]
 * - `label`        : human-readable field name used in the error toast.
 *                    e.g. "Part Number" or "Part Number + Condition"
 * - `existingRows` : rows already present in the table. Incoming CSV rows are
 *                    checked against these so re-uploading the same file is blocked.
 */
export type CSVDuplicateConfig<TRow extends Record<string, any> = Record<string, any>> = {
    keys: (keyof TRow)[];
    label?: string;
    existingRows?: TRow[];
};

export type CSVUploadButtonProps<TRow extends Record<string, any> = Record<string, any>> = {
    /** Column-to-row mapping configuration */
    fieldMappings: CSVFieldMapping<TRow>[];

    /** Called with the fully mapped rows after the user confirms the upload */
    onUpload: (rows: TRow[]) => void;

    /** Factory for a blank row - gives each parsed row its own defaults/keys */
    createEmptyRow: () => TRow;

    /**
     * Maximum number of rows allowed.
     * @default 100
     */
    maxRows?: number;

    /**
     * When provided, the component checks for duplicates by the given keys and
     * fires an error toast listing the offending values instead of uploading.
     *
     * Checks TWO scopes:
     *   1. Within the uploaded CSV itself (intra-file duplicates)
     *   2. Against `existingRows` already in the table (cross-check)
     *
     * Example - block duplicate part numbers:
     *   duplicateCheck={{ keys: ["part_number_id"], label: "Part Number", existingRows: rows }}
     *
     * Example - block duplicate part number + condition combos:
     *   duplicateCheck={{ keys: ["part_number_id", "condition_id"], label: "Part Number + Condition", existingRows: rows }}
     */
    duplicateCheck?: CSVDuplicateConfig<TRow>;

    /** Custom text shown in the confirmation dialog body */
    confirmBodyText?: string;

    /** Custom text shown in the confirmation dialog header */
    confirmHeaderText?: string;

    /** Chakra Button props forwarded to the trigger button */
    buttonLabel?: string;
    colorScheme?: string;
    size?: string;
    isDisabled?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCompositeKey<TRow extends Record<string, any>>(
    row: TRow,
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
    confirmBodyText = "Are you sure you want to upload this file? Existing rows with data will be kept.",
    confirmHeaderText = "Upload CSV",
    buttonLabel = "Upload Items",
    colorScheme = "green",
    size = "sm",
    isDisabled = false,
}: CSVUploadButtonProps<TRow>) {
    const toastError = useToastError();
    const [fileKey, setFileKey] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [openConfirmation, setOpenConfirmation] = useState(false);

    const inputId = useRef(`csv-upload-${crypto.randomUUID()}`).current;

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setOpenConfirmation(true);
        }
        setFileKey(k => k + 1);
    };

    const handleConfirm = async () => {
        if (!uploadedFile) return;

        const parsedRows: TODO = await parseCSV(uploadedFile);

        if (parsedRows.length > maxRows) {
            toastError({
                title: `Uploaded CSV has more than ${maxRows} rows. Max allowed is ${maxRows}.`,
            });
            setOpenConfirmation(false);
            return;
        }

        // Map raw CSV rows -> typed TRow objects
        const mapped: TRow[] = parsedRows.map((raw: TODO) => {
            const base = createEmptyRow();
            fieldMappings.forEach(({ csvKey, rowKey, transform }) => {
                const rawValue = raw[csvKey] ?? "";
                (base as any)[rowKey] = transform ? transform(rawValue) : rawValue;
            });
            return base;
        });

        // ── Duplicate detection ────────────────────────────────────────────────
        if (duplicateCheck) {
            const { keys, label = keys.join(" + "), existingRows = [] } = duplicateCheck;
            const readableKey = (k: string) => k.split("||").join(" + ");

            // Seed seen-set with keys already present in the table
            const seen = new Set<string>(
                existingRows
                    .filter(row => keys.some(k => !!row[k]))
                    .map(row => buildCompositeKey(row, keys))
            );

            const intraDuplicates = new Set<string>(); // duplicates within the CSV
            const crossDuplicates = new Set<string>(); // CSV rows clashing with existing table rows

            mapped.forEach(row => {
                const hasValue = keys.some(k => !!row[k]);
                if (!hasValue) return;

                const compositeKey = buildCompositeKey(row, keys);

                if (seen.has(compositeKey)) {
                    const isFromExisting = existingRows.some(
                        er => buildCompositeKey(er, keys) === compositeKey
                    );
                    if (isFromExisting) {
                        crossDuplicates.add(compositeKey);
                    } else {
                        intraDuplicates.add(compositeKey);
                    }
                } else {
                    seen.add(compositeKey);
                }
            });

            // Cross-check errors take priority (more actionable message)
            if (crossDuplicates.size > 0) {
                toastError({
                    title: `Duplicate ${label} — already exists in the table`,
                    description: [...crossDuplicates].map(readableKey).join(", "),
                });
                setOpenConfirmation(false);
                return;
            }

            if (intraDuplicates.size > 0) {
                toastError({
                    title: `Duplicate ${label} entries found in the uploaded CSV`,
                    description: 'Those are not allowed to add to existing'
                    //[...intraDuplicates].map(readableKey).join(", "),
                });
                setOpenConfirmation(false);
                return;
            }
        }

        onUpload(mapped);
        setOpenConfirmation(false);
    };

    // ─── Render ────────────────────────────────────────────────────────────────

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
            />
        </>
    );
}

export default CSVUploadButton;