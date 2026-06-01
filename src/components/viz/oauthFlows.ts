export type ActorId = 'user' | 'client' | 'auth' | 'resource';

export interface Actor {
  id: ActorId;
  label: string;
  shortLabel: string;
  colorClass: string;
}

export const ACTORS: Record<ActorId, Actor> = {
  user: { id: 'user', label: 'Resource Owner / User-Agent', shortLabel: 'User', colorClass: 'bg-actor-user' },
  client: { id: 'client', label: 'OAuth Client', shortLabel: 'Client', colorClass: 'bg-actor-client' },
  auth: { id: 'auth', label: 'Authorization Server', shortLabel: 'Auth Server', colorClass: 'bg-actor-auth' },
  resource: { id: 'resource', label: 'Resource Server', shortLabel: 'Resource', colorClass: 'bg-actor-resource' },
};

export interface FlowStep {
  id: string;
  title: string;
  description: string;
  from: ActorId;
  to: ActorId;
  message: string;
  channel: 'front' | 'back' | 'internal';
  request?: string;
  response?: string;
}

export interface OAuthFlow {
  id: string;
  name: string;
  subtitle: string;
  steps: FlowStep[];
}

export const OAUTH_FLOWS: OAuthFlow[] = [
  {
    id: 'auth-code-pkce',
    name: 'Authorization Code + PKCE',
    subtitle: 'The modern OAuth flow for user-facing web, mobile, and desktop clients',
    steps: [
      {
        id: 'initiate',
        title: 'Resource Owner initiates authorization',
        description: 'JayP clicks "Connect Google Drive" in Print Express. In OAuth terms, JayP is the Resource Owner, Print Express is the Client, and the browser is the User-Agent.',
        from: 'user',
        to: 'client',
        message: 'Click "Sign in" / "Connect"',
        channel: 'front',
      },
      {
        id: 'pkce-state',
        title: 'Client prepares state and PKCE values',
        description: 'Print Express generates a CSRF-protection state value and a PKCE code_verifier. It derives code_challenge = BASE64URL(SHA-256(code_verifier)) and stores the verifier locally for the later token request.',
        from: 'client',
        to: 'client',
        message: 'Generate state + code_verifier',
        channel: 'internal',
        request: 'state = random_nonce()\ncode_verifier = random(43-128 chars)\ncode_challenge = BASE64URL(SHA-256(code_verifier))\ncode_challenge_method = S256',
      },
      {
        id: 'authorization-request',
        title: 'Client sends Authorization Request',
        description: 'Print Express redirects JayP’s browser to Google Accounts. The Authorization Request asks for an authorization code, declares the redirect_uri, requested Google Drive scope, state, and PKCE code_challenge.',
        from: 'client',
        to: 'auth',
        message: 'GET /authorize',
        channel: 'front',
        request: 'GET https://accounts.google.com/o/oauth2/v2/auth\n  ?response_type=code\n  &client_id=print_express_web\n  &redirect_uri=https%3A%2F%2Fprint.example.com%2Foauth%2Fcallback\n  &scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly\n  &state=xyz123\n  &code_challenge=...\n  &code_challenge_method=S256',
      },
      {
        id: 'authenticate',
        title: 'Authorization Server authenticates the user',
        description: 'Google Accounts authenticates JayP. This may involve password, passkey, SSO, MFA, or an existing Google session. Print Express does not see the password.',
        from: 'user',
        to: 'auth',
        message: 'Authenticate Resource Owner',
        channel: 'front',
      },
      {
        id: 'consent',
        title: 'Authorization Server obtains consent',
        description: 'Google Accounts shows a consent screen for the requested Google Drive scope. JayP approves or denies Print Express access to read Drive files.',
        from: 'user',
        to: 'auth',
        message: 'Approve requested scopes',
        channel: 'front',
      },
      {
        id: 'authorization-response',
        title: 'Authorization Server returns an authorization code',
        description: 'After approval, Google redirects JayP’s browser back to the registered Print Express redirect_uri with a short-lived authorization code and the original state value.',
        from: 'auth',
        to: 'client',
        message: '302 redirect with code + state',
        channel: 'front',
        response: 'HTTP/1.1 302 Found\nLocation: https://print.example.com/oauth/callback\n  ?code=auth_abc123\n  &state=xyz123',
      },
      {
        id: 'validate-state',
        title: 'Client validates state and redirect_uri',
        description: 'Print Express verifies that the returned state matches what it stored before redirecting. It also handles the callback only on the registered redirect_uri. This prevents login CSRF and redirect mix-up bugs.',
        from: 'client',
        to: 'client',
        message: 'Validate state',
        channel: 'internal',
      },
      {
        id: 'token-request',
        title: 'Client sends Token Request',
        description: 'Print Express exchanges the authorization code at Google’s token endpoint. It includes grant_type=authorization_code, the code, redirect_uri, client_id, and the original PKCE code_verifier. Confidential clients also authenticate with a client secret or stronger method.',
        from: 'client',
        to: 'auth',
        message: 'POST /token',
        channel: 'back',
        request: 'POST https://oauth2.googleapis.com/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code\n&code=auth_abc123\n&redirect_uri=https%3A%2F%2Fprint.example.com%2Foauth%2Fcallback\n&client_id=print_express_web\n&code_verifier=...',
      },
      {
        id: 'token-response',
        title: 'Authorization Server issues tokens',
        description: 'Google validates the authorization code, redirect_uri, client identity, and PKCE verifier. If valid, it returns an access_token for the requested Drive scope. With OpenID Connect scopes, it may also return an id_token. It may return a refresh_token if allowed.',
        from: 'auth',
        to: 'client',
        message: 'Return access_token',
        channel: 'back',
        response: '{\n  "access_token": "eyJ...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "refresh_token": "rt_...",\n  "id_token": "eyJ..."\n}',
      },
      {
        id: 'resource-request',
        title: 'Client calls Resource Server with Bearer token',
        description: 'Print Express calls the Google Drive API with Authorization: Bearer <access_token>. The access token authorizes API access; it is not JayP’s password and should be treated as a credential.',
        from: 'client',
        to: 'resource',
        message: 'GET /api with Bearer token',
        channel: 'back',
        request: 'GET https://www.googleapis.com/drive/v3/files\nAuthorization: Bearer eyJ...',
      },
      {
        id: 'resource-response',
        title: 'Resource Server validates token and responds',
        description: 'Google Drive validates the access token. It may verify a JWT signature using Google keys, or validate an opaque token internally. If valid and scoped correctly, it returns JayP’s Drive files.',
        from: 'resource',
        to: 'client',
        message: 'Return protected resource',
        channel: 'back',
        response: '{\n  "files": [\n    { "id": "file_123", "name": "vacation.jpg" }\n  ]\n}',
      },
      {
        id: 'refresh',
        title: 'Client refreshes the access token',
        description: 'When the access_token is near expiry, the client can use a refresh_token to request a new access_token. Modern providers often rotate refresh tokens and revoke the previous one.',
        from: 'client',
        to: 'auth',
        message: 'POST /token with refresh_token',
        channel: 'back',
        request: 'POST /token\n\ngrant_type=refresh_token\n&refresh_token=rt_...\n&client_id=...',
        response: '{\n  "access_token": "eyJ...(new)",\n  "expires_in": 3600,\n  "refresh_token": "rt_...(rotated)"\n}',
      },
    ],
  },
  {
    id: 'client-credentials',
    name: 'Client Credentials',
    subtitle: 'Machine-to-machine calls where no Resource Owner is present',
    steps: [
      {
        id: 'cc-token',
        title: 'Client authenticates directly at token endpoint',
        description: 'There is no Resource Owner or User-Agent redirect. The confidential client authenticates as itself at the token endpoint and asks for an access token for its own resources.',
        from: 'client',
        to: 'auth',
        message: 'POST /token',
        channel: 'back',
        request: 'POST /token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=client_credentials\n&client_id=...\n&client_secret=...\n&scope=api:read',
        response: '{\n  "access_token": "eyJ...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}',
      },
      {
        id: 'cc-api',
        title: 'Client calls Resource Server',
        description: 'The client uses the access token in the Authorization header. The Resource Server validates token audience, scope, expiry, and signature/introspection result.',
        from: 'client',
        to: 'resource',
        message: 'GET /api with Bearer token',
        channel: 'back',
        request: 'GET /api/data\nAuthorization: Bearer eyJ...',
        response: '{ "data": [...] }',
      },
    ],
  },
];

export const APP_TYPE_GUIDE = [
  {
    type: 'Website with a backend',
    secret: 'Can keep secrets',
    flow: 'Authorization Code',
    why: 'The backend can keep a client secret and exchange the authorization code server-side',
  },
  {
    type: 'Browser-only app',
    secret: 'Cannot keep secrets',
    flow: 'Authorization Code + PKCE',
    why: 'Browser code cannot keep a client secret, so PKCE protects the authorization code exchange',
  },
  {
    type: 'Mobile or desktop app',
    secret: 'Cannot keep secrets',
    flow: 'Authorization Code + PKCE',
    why: 'Installed apps cannot keep a client secret, so PKCE is required',
  },
  {
    type: 'Backend service',
    secret: 'Can keep secrets',
    flow: 'Client Credentials',
    why: 'There is no Resource Owner; the service authenticates as itself',
  },
  {
    type: 'TV or CLI',
    secret: 'Usually cannot keep secrets',
    flow: 'Device code',
    why: 'The user finishes login on another device with a real browser',
  },
];
