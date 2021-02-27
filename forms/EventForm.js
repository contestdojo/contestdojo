import { Alert, AlertIcon, Button, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import FormField from "~/components/FormField";

const schema = yup.object().shape({
    name: yup.string().required().label("Event Name"),
    // maxStudents: yup.number().required().label("# Students per Team"),
    // maxTeams: yup.number().nullable().label("# Teams per Organization"),
});

const EventForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
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
                    name="name"
                    label="Event Name"
                    placeholder="Math High School"
                    error={errors.name}
                    isRequired
                />

                {/* <Stack direction="row" spacing={4}>
                    <FormField
                        ref={register}
                        type="number"
                        name="maxStudents"
                        label="# Students per Team"
                        placeholder="8"
                        error={errors.maxStudents}
                        isRequired
                    />
                    <FormField
                        ref={register}
                        type="number"
                        name="maxTeams"
                        label="# Teams per Organization"
                        placeholder="3"
                        error={errors.maxTeams}
                    />
                </Stack> */}

                <Button isLoading={isLoading} type="submit" colorScheme="blue">
                    {buttonText ?? "Submit"}
                </Button>
            </Stack>
        </form>
    );
};

export default EventForm;
