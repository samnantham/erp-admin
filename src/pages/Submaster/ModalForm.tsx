import { CreateUpdateModal } from "@/components/ReUsable/CreateUpdateModal";
import { Stack } from '@chakra-ui/react';
import {
  useCreateSubmasterItem,
  useUpdateSubmasterItem,
} from "@/services/submaster/service";
import { FieldInput } from "@/components/FieldInput";
import { BasicForm } from "@/types/global-types";
import { formatModelTitle } from '@/helpers/commonHelper';
import { submasterConfig } from "@/pages/Submaster/submasterConfig";

type ModalFormProps = {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  model: string;
  existInfo?: any;
  onSuccess?: (createdValue?: unknown) => void;
  createdInputValue?: string;
  hideCreate?: boolean;
};

export function SubMasterModalForm({
  isOpen,
  onClose,
  isEdit,
  model,
  existInfo,
  onSuccess,
  createdInputValue = '',
  hideCreate = false,
}: ModalFormProps) {
  const config = submasterConfig[model ?? ""] ?? submasterConfig.default;
  const title = formatModelTitle(model);

  const createMutation = useCreateSubmasterItem(model ?? "");
  const updateMutation = useUpdateSubmasterItem(model ?? "");

  if (hideCreate && !isEdit) return null;

  return (
    <CreateUpdateModal<BasicForm>
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      title={title}
      isEdit={isEdit}
      existInfo={existInfo}
      createMutation={createMutation}
      updateMutation={updateMutation}
      invalidateKeys={["submasterItemIndex", model]}
      fields={config.fields.map((f: any) => f.name)}
    >
      <Stack spacing={4}>
        {config.fields.map((field: any) => {
          const { component, name, label, placeholder, required, type,
            maxValue, maxLength, isDisabled, ...rest } = field;  // 👈 rest captures options, radioGroupProps, etc.
          const Component = component || FieldInput;

          return (
            <Component
              key={name}
              label={label}
              name={name}
              placeholder={placeholder}
              required={required}
              defaultValue={
                existInfo?.[name] ??
                (!isEdit && createdInputValue && name === 'name'
                  ? createdInputValue
                  : "")
              }
              type={type ?? 'alpha'}
              maxValue={maxValue ?? undefined}
              maxLength={maxLength ?? undefined}
              isDisabled={isDisabled ?? false}
              {...rest}   // ✅ spreads options, radioGroupProps, or anything else
            />
          );
        })}
      </Stack>
    </CreateUpdateModal>
  );
}

export default SubMasterModalForm;