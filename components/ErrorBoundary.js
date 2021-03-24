import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <Alert status="error">
                    <AlertIcon />
                    <Box>
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>An unexpected error has occurred. Try refreshing the page.</AlertDescription>
                    </Box>
                </Alert>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
