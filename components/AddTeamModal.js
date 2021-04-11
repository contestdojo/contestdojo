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
    name: yup.string().required().label("Team Name"),
});

const AddTeamModal = ({ isOpen, onClose, onSubmit, isLoading, error }) => {
    const { register, handleSubmit, errors } = useForm({
        mode: "onTouched",
        resolver: yupResolver(schema),
    });

    const ref = useRef();

    return (
        <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add Team</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form id="add-team" onSubmit={handleSubmit(onSubmit)}>
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
                                name="name"
                                label="Team Name"
                                placeholder="New Team"
                                error={errors.name}
                                isRequired
                            />
                        </Stack>
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button type="submit" form="add-team" colorScheme="blue" mr={3} isLoading={isLoading}>
                        Save
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddTeamModal;
