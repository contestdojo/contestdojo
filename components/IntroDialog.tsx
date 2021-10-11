import { Button } from "@chakra-ui/button";
import { Stack, Text } from "@chakra-ui/layout";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
} from "@chakra-ui/modal";
import { useRef } from "react";

type IntroDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const IntroDialog = ({ isOpen, onClose }: IntroDialogProps) => {
    const ref = useRef(null);

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={ref} onClose={onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Welcome to ContestDojo!
                    </AlertDialogHeader>

                    <AlertDialogBody as={Stack} spacing={4}>
                        <Text>
                            ContestDojo is an online math competition platform used by events such as the Stanford Math
                            Tournament and the Berkeley Math Tournament.
                        </Text>
                        <Text>
                            If you've used ContestDojo in the past for another tournament, such as SMT 2021, please sign
                            in with your existing account.
                        </Text>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button colorScheme="blue" ref={ref} onClick={onClose}>
                            OK
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default IntroDialog;
