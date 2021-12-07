import TextField, { TextFieldProps } from "@material-ui/core/TextField";

export default function TextFieldEx(props: TextFieldProps) {
    return (
        <TextField {...props} margin="dense" className="textFieldEx" InputLabelProps={{
            shrink: true,
        }} />
    );
}
