# SchemaSage
#steps to remember:
1. setup the tsconfig marker "here" steps
2. added the next-auth.d.ts file
3. We begin with nextauth setup
4. In the backend we have a main router that imports the auth router
5. In the auth router we have the register and login routes -> {
    now remember that we returned the user object from the prisma client
    and we also returned the token
}
6. login-fomr line 17 we have the signIn function from next-auth/react it sends the data to authorize function we defined in route.ts of auths.
7.  authorize function is the one that sends the data to the backend and returns the user object and token