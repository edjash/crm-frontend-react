import { object, string } from 'yup';
import './locale.ts';

const companySchema = object({
    firstname:
        string()
            .max(255)
            .required(),
});

export default companySchema;