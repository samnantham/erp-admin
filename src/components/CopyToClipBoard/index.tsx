import {
  IconButton,
  Tooltip,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";
import { MouseEvent, useEffect } from "react";

type CopyToClipboardProps = {
  value: string;
  label?: string;
};

export const CopyToClipboard = ({
  value,
  label = "Click here to Copy",
}: CopyToClipboardProps) => {
  const { onCopy, hasCopied } = useClipboard(value);
  const toast = useToast();

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation(); // ⭐ prevents Tab change
    onCopy();
  };

  useEffect(() => {
    if (hasCopied) {
      toast({
        title: "Copied to clipboard",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    }
  }, [hasCopied, toast]);

  return (
    <Tooltip label={hasCopied ? "Copied!" : label} hasArrow>
      <IconButton
        aria-label="Copy to clipboard"
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        size="sm"
        onClick={handleClick}
        variant="ghost"
        zIndex={1} // optional, safe
      />
    </Tooltip>
  );
};

export default CopyToClipboard;
