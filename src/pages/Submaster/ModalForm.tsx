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
};

export function SubMasterModalForm({
  isOpen,
  onClose,
  isEdit,
  model,
  existInfo,
  onSuccess,
  createdInputValue = ''
}: ModalFormProps) {
  const config = submasterConfig[model ?? ""] ?? submasterConfig.default;
  const title = formatModelTitle(model);
  const createMutation = useCreateSubmasterItem(model ?? "");
  const updateMutation = useUpdateSubmasterItem(model ?? "");

  return (
    <CreateUpdateModal<BasicForm>
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess} // ✅ passed down
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
          const Component = field.component || FieldInput;
          return (
            <Component
              key={field.name}
              label={field.label}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              defaultValue={
                existInfo?.[field.name] ??
                (!isEdit && createdInputValue && field.name === 'name'
                  ? createdInputValue
                  : "")
              }
              type={field.type ?? 'alpha'}
              maxValue={field.maxValue ?? undefined}
              maxLength={field.maxLength ?? undefined}
            />
          );
        })}
      </Stack>
    </CreateUpdateModal>
  );
}

export default SubMasterModalForm;