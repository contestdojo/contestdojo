import { VStack } from "@chakra-ui/react";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import { useUserData } from "~/helpers/utils";

const Home = () => {
    const { ref: userRef, data: user } = useUserData();

    const firestore = useFirestore();
    const eventsQuery = firestore.collectionGroup("students").where("user", "==", userRef);
    const events = useFirestoreCollectionData(eventsQuery, { idField: "id" });

    return (
        <VStack>
            <p>
                Signed in as: {user.fname} {user.lname}
            </p>
        </VStack>
    );
};

export default Home;
