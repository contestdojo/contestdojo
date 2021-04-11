import {
    Alert,
    AlertIcon,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import FormField from "~/components/FormField";

const schema = yup.object({
    fname: yup.string().required().label("First Name"),
    lname: yup.string().required().label("Last Name"),
    email: yup.string().email().required().label("Email Address"),
});

const AddStudentModal = ({ isOpen, onClose, onSubmit, isLoading, error }) => {
    const { register, handleSubmit, errors } = useForm({
        mode: "onTouched",
        resolver: yupResolver(schema),
    });

    const ref = useRef();

    return (
        <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Invite Student</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form id="add-student" onSubmit={handleSubmit(onSubmit)}>
                        <Stack spacing={4}>
                            {error && (
                                <Alert status="error">
                                    <AlertIcon />
                                    {error.message}
                                </Alert>
                            )}

                            <FormField
                                ref={e => {
                                    register(e);
                                    ref.current = e;
                                }}
                                name="fname"
                                label="First Name"
                                placeholder="Blaise"
                                error={errors.fname}
                                isRequired
                            />

                            <FormField
                                ref={register}
                                name="lname"
                                label="Last Name"
                                placeholder="Pascal"
                                error={errors.lname}
                                isRequired
                            />

                            <FormField
                                ref={register}
                                type="email"
                                name="email"
                                label="Email Address"
                                placeholder="blaise.pascal@gmail.com"
                                error={errors.email}
                                isRequired
                            />
                        </Stack>
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button type="submit" form="add-student" colorScheme="blue" mr={3} isLoading={isLoading}>
                        Save
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddStudentModal;
