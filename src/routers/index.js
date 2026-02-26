import { Children } from "react";
import Error404 from "../pages/Error404";


export const router = [
  {
    // path: '/',
    // element: <LayoutDefaults />,
    // children: [
    // {
    //     path: '/',
    //     element: <Home />
    // },
    // {
    //     path: 'about',
    //     element: <About />
    // },
    // {
    //     path: 'contact',
    //     element: <Contact />
    // },
    // {
    //     path: 'login',
    //     element: <Login />
    // },

    // {
    //     path: '/',
    //     element: <PrivateRouter />,
    //     children: [
    //         {
    //             path: 'inforUser',
    //             element: <InforUser />,

    //         }
    //     ]
    // },

    //]
    path: '*',
    element: <Error404 />
  }
]

