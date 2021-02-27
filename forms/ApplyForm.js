import {
    Alert,
    AlertIcon,
    Button,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Stack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import FormField from "~/components/FormField";

const OrgForm = ({ onSubmit, isLoading, error, buttonText, defaultValues, maxTeams }) => {
    const schema = yup.object().shape({
        applyTeams: yup
            .number()
            .typeError("You must specify a number")
            .required()
            .min(1)
            .max(maxTeams)
            .label("Number of Teams"),
    });

    const { register, handleSubmit, errors } = useForm({
        defaultValues,
        mode: "onTouched",
        resolver: yupResolver(schema),
    });

    // TODO: Number Input

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
                    // as={NumberInput}
                    ref={register}
                    name="applyTeams"
                    label="Number of Teams"
                    placeholder="3"
                    error={errors.applyTeams}
                    isRequired
                >
                    {/* <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper> */}
                </FormField>

                <Button isLoading={isLoading} type="submit" colorScheme="blue">
                    {buttonText ?? "Submit"}
                </Button>
            </Stack>
        </form>
    );
};

export default OrgForm;
