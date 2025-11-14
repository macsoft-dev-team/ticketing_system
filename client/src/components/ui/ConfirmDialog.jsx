import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";

const ConfirmDialog = ({
  open,
  title = "Confirm",
  description = "Are you sure?",
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel",
  danger = false,
}) => (
  <Dialog open={open} onOpenChange={open => !open ? onCancel() : null}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="mb-4 text-gray-700 ">{description}</div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button
          variant={danger ? "destructive" : "default"}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
