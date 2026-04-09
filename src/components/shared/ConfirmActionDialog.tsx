import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onOpenChange,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-slate-200 bg-white shadow-2xl dark:border-[#303030] dark:bg-[#1c1c1c]">
        <AlertDialogHeader className="space-y-3 text-left">
          <AlertDialogTitle className="text-xl font-semibold text-slate-950 dark:text-white">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-slate-600 dark:text-zinc-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-3">
          <AlertDialogCancel className="mt-0 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#353535] dark:bg-[#171717] dark:text-zinc-200 dark:hover:bg-[#202020]">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
