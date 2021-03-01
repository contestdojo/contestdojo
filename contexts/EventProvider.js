import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createContext, useContext } from "react";
import { useFirestore, useFirestoreDoc } from "reactfire";

export const EventContext = createContext();
export const useEvent = () => useContext(EventContext);

const EventProvider = ({ children }) => {
    const router = useRouter();
    const firestore = useFirestore();

    const { eventId } = router.query;
    const eventRef = firestore.collection("events").doc(eventId);
    const { data: event } = useFirestoreDoc(eventRef);

    if (!event.exists || event.data().hide) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box>
                    <AlertTitle>Event Not Found</AlertTitle>
                    <AlertDescription>The event you are trying to access was not found.</AlertDescription>
                </Box>
            </Alert>
        );
    }

    return (
        <EventContext.Provider
            value={{
                ref: eventRef,
                data: event.data(),
            }}
        >
            {children}
        </EventContext.Provider>
    );
};

export default EventProvider;
