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

export const DialogContainer = ({ type, title, description, isOpen, onClose, onConfirm }) => {
    const ref = useRef();

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={ref} motionPreset="slideInBottom">
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {title}
                    </AlertDialogHeader>
                    <AlertDialogBody>{description}</AlertDialogBody>
                    <AlertDialogFooter>
                        {type === "alert" ? (
                            <Button colorScheme="blue" ref={ref} onClick={onClose}>
                                OK
                            </Button>
                        ) : type === "confirm" ? (
                            <>
                                <Button ref={ref} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button colorScheme="blue" onClick={handleConfirm} ml={3}>
                                    Confirm
                                </Button>
                            </>
                        ) : null}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

const DialogProvider = ({ children }) => {
    const [dialogs, setDialogs] = useState([]);

    const createDialog = ({ title, description, type, onConfirm }) => {
        const dialog = { title, description, type, onConfirm, isOpen: true };
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
