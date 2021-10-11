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
    number: yup.string().required().label("Number of Seats"),
});

const PurchaseSeatsModal = ({ isOpen, onClose, onSubmit, isLoading, error }) => {
    const { register, handleSubmit, errors } = useForm({
        mode: "onTouched",
        resolver: yupResolver(schema),
    });

    const ref = useRef();

    return (
        <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Purchase Seats</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form id="purchase-seats" onSubmit={handleSubmit(onSubmit)}>
                        <Stack spacing={4}>
                            {error && (
                                <Alert status="error">
                                    <AlertIcon />
                                    {error.message}
                                </Alert>
                            )}

                            <FormField
                                type="number"
                                ref={e => {
                                    register(e);
                                    ref.current = e;
                                }}
                                name="number"
                                label="Number of Seats"
                                placeholder="8"
                                error={errors.number}
                                isRequired
                            />
                        </Stack>
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button type="submit" form="purchase-seats" colorScheme="blue" mr={3} isLoading={isLoading}>
                        Checkout
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default PurchaseSeatsModal;