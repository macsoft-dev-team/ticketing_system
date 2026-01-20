import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

const ConfirmDeleteDialog = ({ open, onOpenChange, templateToDelete, onConfirm }) => (
  <ConfirmDialog open={open} onOpenChange={onOpenChange}>
    <ConfirmDialogContent>
      <ConfirmDialogHeader>
        <ConfirmDialogTitle>Delete Template</ConfirmDialogTitle>
      </ConfirmDialogHeader>
      <div className="py-4">
        <p className="text-sm">
          Are you sure you want to delete template <span className="font-semibold">{templateToDelete?.name}</span>?
        </p>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:border-gray-400 dark:bg-gray-800 dark:text-gray-100">
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} className="dark:border-red-700 dark:bg-red-700 dark:text-white">
          Delete
        </Button>
      </div>
    </ConfirmDialogContent>
  </ConfirmDialog>
);

export default ConfirmDeleteDialog;
