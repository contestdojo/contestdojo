import { Alert, AlertIcon, Button, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import FormField from "~/components/FormField";

const schema = yup.object().shape({
    parentEmail: yup.string().email().required().label("Parent Email Address"),
});

const ParentEmailForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
    const { register, handleSubmit, errors } = useForm({
        defaultValues,
        mode: "onTouched",
        resolver: yupResolver(schema),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error.message}
                    </Alert>
                )}

                <FormField
                    ref={register}
                    name="parentEmail"
                    label="Parent Email Address"
                    placeholder="john.doe@gmail.com"
                    error={errors.parentEmail}
                    isRequired
                />

                <Button isLoading={isLoading} type="submit" colorScheme="blue">
                    {buttonText ?? "Submit"}
                </Button>
            </Stack>
        </form>
    );
};

export default ParentEmailForm;
