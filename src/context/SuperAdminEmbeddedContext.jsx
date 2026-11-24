import React, { createContext, useContext } from 'react';

export const SuperAdminEmbeddedContext = createContext(false);

export const useSuperAdminEmbedded = () => useContext(SuperAdminEmbeddedContext);

export default SuperAdminEmbeddedContext;
