import React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";
import { Button } from "@tailwindComponents/Elements/Button";

export function ConfirmDialog ({ open, onOpenChange, title, description, onConfirm, confirmLabel = 'Supprimer' }) {
	const confirm = () => { onConfirm(); onOpenChange(false); };

	return <Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				{description && <DialogDescription>{description}</DialogDescription>}
			</DialogHeader>
			<DialogFooter>
				<Button type="default" onClick={() => onOpenChange(false)}>Annuler</Button>
				<Button type="red" iconLeft="trash" onClick={confirm}>{confirmLabel}</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>;
}
