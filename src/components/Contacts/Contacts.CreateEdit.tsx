import { CSSObject } from '@emotion/react';
import { Box, Theme, useMediaQuery, Tabs, Tab } from '@mui/material';
import { DialogProps } from '@mui/material/Dialog';
import { uniqueId } from 'lodash';
import { CSSProperties, useEffect, useRef, useState } from 'react';
import contactSchema from '../../validation/contactSchema';
import apiClient from '../apiClient';
import DialogEx from '../Dialogs/DialogEx';
import CountrySelect from '../Form/CountrySelect';
import Fieldset from '../Form/Fieldset';
import Form from '../Form/Form';
import MultiFieldset from '../Form/MultiFieldset';
import ProfileAvatar from '../Form/ProfileAvatar';
import RemoteSelect from '../Form/RemoteSelect';
import SearchField from '../Form/SearchField';
import TextFieldEx from '../Form/TextFieldEx';
import Overlay from '../Overlay';
import SocialIcon from '../SocialIcon';
import TabPanel, { TabLabel } from '../TabPanel';

export interface ShowCreateEditProps {
    contactId: number;
    fullname: string;
};

interface CreateEditState {
    loading: boolean;
    ready: boolean;
    open: boolean;
    defaultValues: Record<string, any>;
    activeTab: number;
}

type CreateEditProps = DialogProps & {
    type: 'new' | 'edit',
    data?: ShowCreateEditProps,
    onCancel: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onSave: () => void;
};

export default function ContactCreateEdit(props: CreateEditProps) {

    const [state, setState] = useState<CreateEditState>({
        loading: false,
        ready: (props.type === 'new'),
        open: true,
        defaultValues: {},
        activeTab: 0
    });

    useEffect(() => {
        if (props.type === 'edit' && !state.ready) {
            apiClient.get(`/contacts/${props.data?.contactId}`).then((response) => {
                const values = prepareIncomingValues(response.data);

                setState((state) => ({
                    ...state,
                    open: true,
                    defaultValues: values,
                    ready: true,
                }));
            }).catch((error) => {

            });
        }
    }, [state.ready, props.type, props.data?.contactId]);

    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

    const formId = useRef(uniqueId('contactForm'));

    const onSubmit = (data: any) => {

        setState({ ...state, loading: true });
        const postData = prepareOutgoingValues(data);

        let url = '/contacts';
        if (props.type === 'edit' && props.data?.contactId) {
            url = `${url}/${props.data.contactId}`;
        }

        apiClient.post(url, postData).then((response) => {
            setState({ ...state, loading: false });
            props.onSave();
            if (props.type === 'edit') {
                PubSub.publish('CONTACTS.REFRESH');
            } else {
                PubSub.publish('TOAST.SHOW', {
                    message: 'Contact Added',
                    autoHide: true,
                });
                PubSub.publish('CONTACTS.REFRESH');
            }

        }).catch((response) => {
            setState({ ...state, loading: false });
            // apiClient.showErrors(response, formMethods.setError);
        });
    }

    const onError = (data: any) => {
        console.log("Validation Error", data);
    };

    const prepareOutgoingValues = (values: Record<string, any>) => {
        const pvalues = { ...values };
        if (pvalues.address) {
            pvalues.address =
                pvalues.address.map((item: Record<string, any>) => {
                    if (item.country && typeof item.country === 'object') {
                        item.country = item.country.code;
                    }
                    return item;
                });
        }
        if (pvalues.company && typeof pvalues.company === 'object') {
            pvalues.company = pvalues.company.id;
        }
        return pvalues;
    }

    const prepareIncomingValues = (values: Record<string, any>) => {
        const pvalues = { ...values };
        pvalues.social_media_url.forEach((item: Record<string, string>) => {
            pvalues[`socialmedia.${item.ident}`] = item.url;
        });
        delete pvalues['social_media_url'];

        pvalues.address =
            pvalues.address.map((addr: Record<string, any>) => {
                if (addr?.country_code && addr?.country_name) {
                    addr.country = {
                        code: addr?.country_code,
                        name: addr?.country_name,
                    };
                } else {
                    addr.country = null;
                }
                return addr;
            });

        return pvalues;
    }

    const onAddCompany = (): Promise<Record<string, any>> => {
        return new Promise((resolve, reject) => {
            PubSub.publish('COMPANIES.NEW', {
                onSave: (success: boolean, data: Record<string, any>) => {
                    if (success) {
                        resolve(data.company);
                    } else {
                        reject(data);
                    }
                },
                noAnimation: true,
                hideBackdrop: true,
            })
        });
    }

    let title = "New Contact";
    if (props.type === 'edit') {
        if (!state.ready) {
            return (<Overlay open={true} showProgress={true} />);
        }
        title = props?.data?.fullname ?? 'Unnamed';
    }

    const tabcls: Record<string, CSSProperties> = {
        active: {
            visibility: 'visible',
            position: 'relative',
            zIndex: 2,
            transform: 'translateY(-670)',
            float: 'left'
        },
        hidden: {
            visibility: 'hidden',
            position: 'relative',
            zIndex: 1,
        }
    };

    return (
        <DialogEx
            open={state.open}
            onClose={props.onClose}
            title={title}
            displayMode={isDesktop ? 'normal' : 'mobile'}
            saveButtonProps={{
                type: 'submit',
                form: formId.current
            }}
        >
            <Form
                onSubmit={onSubmit}
                onError={onError}
                defaultValues={state.defaultValues}
                validationSchema={contactSchema}
                id={formId.current}
            >
                <Tabs value={state.activeTab} onChange={(e, n) => {
                    console.log("NEW TAB", n);
                    setState(state => ({ ...state, activeTab: n }));
                }}>
                    <Tab label="General" value={0} />
                    <Tab label="Notes" value={1} />
                </Tabs>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={state.activeTab === 0 ? tabcls.active : tabcls.hidden}>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: (isDesktop) ? '320px 320px 320px' : 'auto',
                                alignItems: 'start',
                                gap: 2
                            }}
                        >
                            <Box display="grid" gap={1}>
                                <Fieldset legend="Personal">
                                    <ProfileAvatar
                                        name="avatar"
                                        sx={{ justifySelf: "center" }}
                                    />
                                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                                        <RemoteSelect
                                            name="title"
                                            label="Title"
                                            sx={{ m: 0 }}
                                            options={[
                                                { value: 'Mr', label: 'Mr' },
                                                { value: 'Mrs', label: 'Mrs' },
                                                { value: 'Miss', label: 'Miss' },
                                                { value: 'Ms', label: 'Ms' },
                                                { value: 'Mx', label: 'Mx' },
                                            ]}
                                        />
                                        <RemoteSelect
                                            label="Pronouns"
                                            name="pronouns"
                                            options={[
                                                { value: 'She/Her', label: 'She/Her' },
                                                { value: 'He/Him', label: 'He/Him' },
                                                { value: 'They/Them', label: 'They/Them' },
                                            ]}
                                        />
                                    </Box>
                                    <Box>
                                        <TextFieldEx
                                            name="firstname"
                                            label="First Name"
                                            required
                                        />
                                        <TextFieldEx
                                            name="lastname"
                                            label="Last Name"
                                        />
                                        <TextFieldEx
                                            name="nickname"
                                            label="Nick Name"
                                        />
                                    </Box>
                                </Fieldset>
                                <Fieldset legend="Company">
                                    <SearchField
                                        url="/companies"
                                        labelField="name"
                                        valueField="id"
                                        name="company"
                                        label="Company"
                                        remoteDataProperty="data"
                                        onAddClick={onAddCompany}
                                    />
                                    <TextFieldEx
                                        name="jobtitle"
                                        label="Job Title"
                                    />
                                </Fieldset>
                            </Box>
                            <Box display="grid" gap={1}>
                                <MultiFieldset
                                    baseName="address"
                                    legend="Address"
                                >
                                    <TextFieldEx name="street" label="Street" />
                                    <TextFieldEx name="town" label="Town / City" />
                                    <TextFieldEx name="county" label="County / State" />
                                    <TextFieldEx name="postcode" label="Zip / Postal Code" />
                                    <CountrySelect
                                        label="Country"
                                        name="country"
                                    />
                                </MultiFieldset>
                                <MultiFieldset
                                    legend="Phone Number"
                                    baseName="phone_number"
                                >
                                    <TextFieldEx name="number" label="Phone Number" />
                                </MultiFieldset>
                            </Box>
                            <Box display="grid" gap={1}>
                                <Fieldset legend="Social Media">
                                    {['LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'Teams', 'Skype'].map((network, index) => (
                                        <Box display="flex" alignItems="center" gap={1} key={network}>
                                            <SocialIcon network={network} />
                                            <TextFieldEx
                                                name={`socialmedia.${network.toLowerCase()}`}
                                                label={network}
                                            />
                                        </Box>
                                    ))}
                                </Fieldset>
                                <MultiFieldset
                                    legend="Email Address"
                                    baseName="email_address"
                                >
                                    <TextFieldEx
                                        name="address"
                                        label="Email Address"
                                    />
                                </MultiFieldset>
                            </Box>
                        </Box>
                    </div>
                    <div style={state.activeTab === 1 ? tabcls.active : tabcls.hidden}>
                        NOTES AND STUFF
                    </div>
                </div>
            </Form>
            <Overlay open={state.loading} />
        </DialogEx>
    );
}
