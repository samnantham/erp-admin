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

export default function ModalForm({
  isOpen,
  onClose,
  isEdit,
  model,
  existInfo,
}: any) {
  const config = submasterConfig[model ?? ""] ?? submasterConfig.default;
  const title = formatModelTitle(model);
  const createMutation = useCreateSubmasterItem(model ?? "");
  const updateMutation = useUpdateSubmasterItem(model ?? "");

  return (
    <CreateUpdateModal<BasicForm>
      isOpen={isOpen}
      onClose={onClose}
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
            defaultValue={existInfo?.[field.name] ?? ""}
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