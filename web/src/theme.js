import { createTheme } from "@mui/material";
import { orange } from "@mui/material/colors";


// A custom theme for this app
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: orange,
  },
  
});

export default theme;
