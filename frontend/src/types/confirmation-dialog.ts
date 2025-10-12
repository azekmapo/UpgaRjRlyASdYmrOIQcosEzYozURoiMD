export interface ConfirmationDialogProps {
    isOpen?: boolean;
    onClose?: () => void;
    onConfirme?: () => void;
    title?: string;
    message?: string;
    buttonText?: string;
}