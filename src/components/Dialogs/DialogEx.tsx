import CloseIcon from '@mui/icons-material/CancelOutlined';
import { Box, IconButton } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { ReactNode, useEffect, useState } from 'react';
import DialogButton from '../DialogButton';

export type DialogExProps = {
    open: boolean;
    title?: string | JSX.Element;
    closeIcon?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
    displayMode?: 'mobile' | 'normal' | string;
    saveButtonProps?: Record<string, any>;
    suppressGlobalCount?: boolean;
    disableRestoreFocus?: boolean;
    hideBackdrop?: boolean;
    transitionDuration?: number;
    children?: ReactNode;
};


export default function DialogEx(props: DialogExProps) {
    const mode = props.displayMode ?? 'normal';
    const config = {
        ...props,
        title: props?.title ?? '',
        closeIcon: props?.closeIcon ?? true,
        disableRestoreFocus: props?.disableRestoreFocus ?? true,
        fullScreen: (mode === 'mobile') ? true : false,
    };

    const [state, setState] = useState({
        open: props.open,
    });

    const onCancel = () => {
        setState(state => ({
            ...state,
            open: false,
        }));
        if (props.onCancel) {
            props.onCancel();
        }
    };

    const onSave = () => {
        if (props.onSave) {
            props.onSave();
        }
    };

    useEffect(() => {
        if (props.suppressGlobalCount) {
            return;
        }

        if (state.open) {
            PubSub.publishSync('DIALOG.OPEN');
        } else {
            PubSub.publishSync('DIALOG.CLOSE');
        }

    }, [state.open, props.suppressGlobalCount]);

    return (
        <Dialog
            open={state.open}
            onClose={onCancel}
            disableRestoreFocus={config.disableRestoreFocus}
            fullScreen={config.fullScreen}
            scroll="paper"
            maxWidth="xl"
            sx={{
                p: 0,
            }}
            BackdropProps={{
                sx: { backdropFilter: 'blur(1px)' }
            }}
            transitionDuration={props.transitionDuration}
            hideBackdrop={props.hideBackdrop}
        >
            {mode === 'normal' && config.title &&
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                    <DialogTitle sx={{ flexGrow: 1 }}>
                        {config.title}
                    </DialogTitle>
                    {config.closeIcon &&
                        <IconButton aria-label="close" onClick={onCancel} className="closeButton">
                            <CloseIcon />
                        </IconButton>
                    }
                </Box>
            }
            {mode === 'mobile' && config.title &&
                <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pr: 2 }}>
                    {config.closeIcon &&
                        <IconButton
                            aria-label="close"
                            onClick={onCancel}
                        >
                            <CloseIcon />
                        </IconButton>
                    }
                    <DialogTitle sx={{ flexGrow: 1 }}>
                        {config.title}
                    </DialogTitle>
                    <DialogButton onClick={onSave} {...props.saveButtonProps}>
                        Save
                    </DialogButton>
                </Box>
            }
            <DialogContent sx={{ p: 0, mt:'60px' }}>
                {props.children}
            </DialogContent>
            {mode === 'normal' &&
                <DialogActions>
                    <DialogButton onClick={onCancel}>
                        Cancel
                    </DialogButton>
                    <DialogButton onClick={onSave} {...props.saveButtonProps}>
                        Save
                    </DialogButton>
                </DialogActions>
            }
        </Dialog>
    );
}
