import { Alert, AlertIcon, Button, Checkbox, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import FormField from "~/components/FormField";

const buildSchema = maxTeams => {
    let applyTeams = yup.number().typeError("You must specify a number").required().min(1).label("Number of Teams");
    if (maxTeams) applyTeams = applyTeams.max(maxTeams);

    return yup.object({
        applyTeams,
        expectedStudents: yup
            .number()
            .typeError("You must specify a number")
            .required()
            .min(1)
            .label("Expected Number of Students"),
        confirmUS: yup.boolean().required().equals([true], "You must select this checkbox."),
    });
};

const ApplyForm = ({ onSubmit, isLoading, error, buttonText, defaultValues, maxTeams }) => {
    const { register, handleSubmit, errors } = useForm({
        defaultValues,
        mode: "onTouched",
        resolver: yupResolver(buildSchema(maxTeams)),
    });

    // TODO: Number Input

    return (
        <form>
            {/* <form onSubmit={handleSubmit(onSubmit)}> */}
            <Stack spacing={4}>
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error.message}
                    </Alert>
                )}

                <FormField
                    ref={register}
                    name="applyTeams"
                    label="Number of Teams"
                    placeholder="3"
                    error={errors.applyTeams}
                    helperText="You may be approved for up to this many teams."
                    isRequired
                />

                <FormField
                    ref={register}
                    name="expectedStudents"
                    label="Expected Number of Students"
                    placeholder="24"
                    error={errors.expectedStudents}
                    helperText="The number of students is not binding, but please provide your best estimate."
                    isRequired
                />

                <FormControl id="confirmUS" isInvalid={errors.confirmUS} isRequired>
                    <FormLabel>This organization is located in the United States.</FormLabel>
                    <Checkbox ref={register} name="confirmUS">
                        I confirm
                    </Checkbox>
                    <FormErrorMessage>{errors.confirmUS?.message}</FormErrorMessage>
                </FormControl>

                <Button isLoading={isLoading} type="submit" colorScheme="blue" disabled>
                    Registration is Closed
                    {/* {buttonText ?? "Submit"} */}
                </Button>
            </Stack>
        </form>
    );
};

export default ApplyForm;
