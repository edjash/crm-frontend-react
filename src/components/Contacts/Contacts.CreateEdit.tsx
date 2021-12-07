import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog, { DialogProps } from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import CountrySelect, { CountryType } from '../../components/CountrySelect';
import Overlay from '../../components/Overlay';
import { ChangeEvent, SyntheticEvent, useState } from 'react';
import apiClient from '../apiClient';
import Fieldset from '../Fieldset';
import TextFieldEx from '../TextFieldEx';

type CreateEditProps = DialogProps & {
    type: string,
    onCancel: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onSave: () => void;
};

export default function ContactCreateEdit(props: CreateEditProps) {

    const title = "New Contact";
    const [state, setState] = useState({
        loading: false,
        fieldValues: {

        }
    });

    const onSubmit = (e: SyntheticEvent) => {
        e.preventDefault();

        setState({
            ...state,
            loading: true
        });

        apiClient.post('/contacts', { ...state.fieldValues })
            .then((response) => {
                setState({ ...state, loading: false });

                if (response.statusText === 'OK') {
                    props.onSave();

                    PubSub.publish('CONTACTS.REFRESH');
                    PubSub.publish('TOAST.SHOW', {
                        message: 'Contact Added',
                        autoHide: true,
                    });
                }
            })
            .catch((error) => {
                setState({ ...state, loading: false });
                //errorResponse(appContext, error);
            });
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {

        setState({
            ...state,
            fieldValues: {
                ...state.fieldValues,
                [e.target.name]: e.target.value
            },
        });
    };

    const onCountryChange = (event: ChangeEvent<{}>, value: CountryType | null) => {

        setState({
            ...state,
            fieldValues: {
                ...state.fieldValues,
                country_code: (value === null) ? '' : value.code
            }
        });
    }

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            maxWidth="lg"
        >
            <DialogTitle>
                {title}
                <IconButton aria-label="close" onClick={props.onCancel} className="closeButton">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={onSubmit}>
                <DialogContent dividers={true}>
                    <Fieldset label="Name">
                        <TextFieldEx name="firstname" label="First Name" onChange={onChange} />
                        <TextFieldEx name="lastname" label="Last Name" onChange={onChange} />
                    </Fieldset>
                    <Fieldset label="Address">
                        <TextFieldEx name="street" label="Street" onChange={onChange} />
                        <TextFieldEx name="town" label="Town / City" onChange={onChange} />
                        <TextFieldEx name="county" label="County / State" onChange={onChange} />
                        <TextFieldEx name="postcode" label="Zip / Postal Code" onChange={onChange} />
                        <CountrySelect name="country_code" onChange={onCountryChange} />
                    </Fieldset>

                </DialogContent>
                <DialogActions>
                    <Button autoFocus size="small" variant="contained" color="secondary" onClick={props.onCancel}>
                        Cancel
                    </Button>
                    <Button variant="contained" size="small" color="secondary" autoFocus type="submit">
                        Save
                    </Button>
                </DialogActions>
            </form>
            <Overlay open={state.loading} />
        </Dialog>
    );
}
