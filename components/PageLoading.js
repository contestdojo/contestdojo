import { Spinner } from "@chakra-ui/react";

const PageLoading = props => (
    <div
        style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <Spinner {...props} />
    </div>
);

export default PageLoading;
