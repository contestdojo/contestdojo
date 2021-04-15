import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
} from "@chakra-ui/react";
import { createContext, useContext, useRef, useState } from "react";

export const DialogContext = createContext();
export const useDialog = () => useContext(DialogContext);

export const DialogContainer = ({ title, description, isOpen, onClose }) => {
    const ref = useRef();

    return (
        <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={ref} motionPreset="slideInBottom">
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {title}
                    </AlertDialogHeader>
                    <AlertDialogBody>{description}</AlertDialogBody>
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

const DialogProvider = ({ children }) => {
    const [dialogs, setDialogs] = useState([]);

    const createDialog = (title, description) => {
        const dialog = { title, description, isOpen: true };
        setDialogs([...dialogs, dialog]);
    };

    const closeDialog = idx => {
        dialogs[idx].isOpen = false;
        setDialogs([...dialogs]);
    };

    const contextValue = useRef([createDialog, closeDialog]);

    return (
        <DialogContext.Provider value={contextValue.current}>
            {children}
            {dialogs.map((dialog, i) => {
                return <DialogContainer key={i} {...dialog} onClose={() => closeDialog(i)} />;
            })}
        </DialogContext.Provider>
    );
};

export default DialogProvider;
