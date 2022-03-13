import { ChangeCircle } from '@mui/icons-material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import ModalProvider from 'mui-modal-provider';
import PullToRefresh from 'pulltorefreshjs';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Toaster from '../components/Toaster';
import { ForgotPassword } from '../routes/ForgotPassword';
import { Home } from '../routes/Home';
import { Login } from '../routes/Login';
import PrivateRoute from '../routes/PrivateRoute';
import { Register } from '../routes/Register';
import theme from '../theme';
import { AppContextProvider } from './AppContext';
import { APP_TITLE } from './constants';
import ReactDOMServer from 'react-dom/server';
import Icon from '@mui/material/Icon';

interface AppState {
    loggedIn: boolean;
    userInfo: Record<string, string> | null;
}

interface LoginData {
    userInfo: Record<string, string>;
}

export default function App() {

    const [state, setState] = useState<AppState>(() => {
        let user = localStorage.getItem('userInfo');
        if (!document.cookie.split(';').some(
            item => item.trim().startsWith('XSRF-TOKEN='))) {
            user = null;
            localStorage.setItem('userInfo', '');
        }

        return {
            loggedIn: !!(user),
            userInfo: (user) ? JSON.parse(user) : null,
        };
    });

    useEffect(() => {
        document.title = APP_TITLE;

        PullToRefresh.init({
            mainElement: 'body',
            classPrefix: 'pullToRefresh',
            onRefresh() {
                //window.location.reload();
            },
            iconArrow: ReactDOMServer.renderToString(
                <ChangeCircle />
            ),
            // iconRefreshing: ReactDOMServer.renderToString(
            //     <ChangeCircle />
            // ),
        });

        PubSub.subscribe('AUTH.LOGIN', (msg: string, data: LoginData) => {
            if (data?.userInfo) {
                localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
                setState(state => ({
                    ...state,
                    loggedIn: true,
                    userInfo: data.userInfo,
                }));
            }
        });

        PubSub.subscribe('AUTH.LOGOUT', () => {
            localStorage.removeItem('userInfo');
            setState(state => ({ ...state, loggedIn: false }));
        })

        return () => {
            PubSub.unsubscribe('AUTH');
        }
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme={true} />
            <ModalProvider beta={true}>
                <AppContextProvider value={state}>
                    <Router>
                        <Switch>
                            <Route path="/login" component={Login} />
                            <Route path="/register" component={Register} />
                            <Route path="/forgot-password" component={ForgotPassword} />
                            <PrivateRoute
                                path="/"
                                component={Home}
                                loggedIn={state.loggedIn}
                            >
                            </PrivateRoute>
                        </Switch>
                    </Router>
                </AppContextProvider>
                <Toaster />
            </ModalProvider>
        </ThemeProvider>
    );
}
