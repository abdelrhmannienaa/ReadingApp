## Access Control

Reademption uses Supabase Auth for account creation, sign-in, session management, and JWT-based authentication. The React Native app stores the signed-in session in AsyncStorage. Supabase Row Level Security protects user-specific library data.

### Sign-Up Flow

```mermaid
sequenceDiagram
    participant User
    participant App as React Native App
    participant Auth as Supabase Auth
    participant DB as Supabase Database
    participant Store as AsyncStorage

    User->>App: Enter email and password
    App->>Auth: signUp(email, password)
    Auth->>DB: Create protected auth user
    DB-->>Auth: User created
    Auth-->>App: Session and JWT
    App->>Store: Save session
    App-->>User: Open authenticated app
```

### Sign-In Flow

```mermaid
sequenceDiagram
    participant User
    participant App as React Native App
    participant Auth as Supabase Auth
    participant DB as Supabase Database
    participant Store as AsyncStorage

    User->>App: Enter email and password
    App->>Auth: signInWithPassword(email, password)
    Auth->>DB: Verify stored credentials
    DB-->>Auth: Credentials valid
    Auth-->>App: Session and JWT
    App->>Store: Save session
    App-->>User: Open authenticated app
```

### Protected Personal-Library Request

```mermaid
sequenceDiagram
    participant App as React Native App
    participant Store as AsyncStorage
    participant SB as Supabase API
    participant RLS as RLS Policy
    participant DB as Supabase Database

    App->>Store: Read saved session/JWT
    Store-->>App: Session
    App->>SB: Request user_books with session
    SB->>RLS: Check auth.uid() equals user_id

    alt User owns row
        RLS->>DB: Allow query
        DB-->>SB: User's library rows
        SB-->>App: Personal library data
    else User does not own row
        RLS-->>SB: Deny access
        SB-->>App: No unauthorized data returned
    end
```

### Implementation Notes

- Supabase Auth manages account creation, password security, session creation, and JWT issuance.
- AsyncStorage persists the user session on the mobile device.
- Shared book metadata is stored in `books`.
- User-specific reading data is stored in `user_books`.
- RLS policies use `auth.uid() = user_id` so users can access only their own library records.
