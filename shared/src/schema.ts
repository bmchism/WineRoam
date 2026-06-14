// GraphQL SDL for the AppSync API. Imported by the CDK infra stack so the
// schema lives next to the shared types it mirrors. Subscriptions drive the
// live tasting + quiz; @aws_* directives are applied in the CDK layer.

export const graphqlSchema = /* GraphQL */ `
  type Distillery {
    nom: ID!
    name: String!
    location: String!
    masterDistiller: String
    altitude: String
    otherBrands: [String!]
    notes: String
  }

  type SourceLink {
    label: String!
    url: String!
  }

  type Bottle {
    id: ID!
    brand: String!
    name: String!
    nom: String!
    expression: String!
    abv: Float!
    proof: Float!
    agaveRegion: String!
    waterSource: String
    fermentation: String
    stillType: String
    crushing: String
    distillation: String
    cooking: String
    aging: String
    aromas: [String!]!
    flavors: [String!]!
    tastingNotes: String
    story: String
    accent: String!
    verified: Boolean
    additiveFree: Boolean
    imageKeys: [String!]
    sources: [SourceLink!]
    createdAt: String
    updatedAt: String
  }

  type Flight {
    id: ID!
    title: String!
    subtitle: String!
    bottleIds: [String!]!
    curated: Boolean!
  }

  type TastingSession {
    sessionId: ID!
    tastingId: String!
    hostId: String!
    joinCode: String!
    status: String!
    pacing: String!
    visibility: String!
    currentStep: Int!
    createdAt: String!
  }

  type Participant {
    sessionId: ID!
    participantId: ID!
    displayName: String!
    accountId: String
    joinedAt: String!
  }

  type Rating {
    sessionId: ID!
    participantId: ID!
    bottleId: ID!
    color: Int
    aroma: Int
    flavor: Int
    finish: Int
    overall: Int
    note: String
    syncedAt: String!
  }

  type Review {
    bottleId: ID!
    userId: ID!
    displayName: String!
    body: String!
    score: Int
    published: Boolean!
    moderation: String
    createdAt: String!
  }

  type QuizQuestion {
    quizId: ID!
    questionId: ID!
    text: String!
    options: [String!]!
    correctIndex: Int!
    explanation: String
    source: String!
  }

  type LeaderboardEntry {
    participantId: ID!
    displayName: String!
    correct: Int!
    total: Int!
    avgMs: Float!
  }

  input RatingInput {
    sessionId: ID!
    participantId: ID!
    bottleId: ID!
    color: Int
    aroma: Int
    flavor: Int
    finish: Int
    overall: Int
    note: String
  }

  input ReviewInput {
    bottleId: ID!
    body: String!
    score: Int
    published: Boolean!
  }

  type Reminder {
    id: ID!
    title: String!
    message: String!
    when: String!
    channel: String!
    email: String
    phone: String
  }

  input ReminderInput {
    id: String!
    title: String!
    message: String!
    when: String!
    channel: String!
    email: String
    phone: String
  }

  type TastingEntry {
    id: ID!
    flightId: String!
    title: String!
    bottleCount: Int!
    avgScore: Float!
    quizCorrect: Int
    quizTotal: Int
    mode: String!
    createdAt: String!
  }

  input TastingEntryInput {
    id: String!
    flightId: String!
    title: String!
    bottleCount: Int!
    avgScore: Float!
    quizCorrect: Int
    quizTotal: Int
    mode: String!
    createdAt: String!
  }

  type Query {
    listBottles: [Bottle!]!
    getBottle(id: ID!): Bottle
    getScanResult(imageKey: String!): Bottle
    listFlights: [Flight!]!
    getSession(sessionId: ID!): TastingSession
    listParticipants(sessionId: ID!): [Participant!]!
    listRatings(sessionId: ID!, bottleId: ID!): [Rating!]!
    listReviews(bottleId: ID!): [Review!]!
    leaderboard(sessionId: ID!): [LeaderboardEntry!]!
    listPendingReviews: [Review!]!
    adminListUsers: [AdminUser!]!
    adminAnalytics(days: Int): [AnalyticsDay!]!
    listMyHistory: [TastingEntry!]!
    listMyFavorites: [String!]!
    listMyReminders: [Reminder!]!
  }

  type ModerationResult {
    verdict: String!
    reason: String!
  }

  type AnalyticsDay {
    day: String!
    pageView: Int!
    tastingStarted: Int!
    scan: Int!
    quizAnswer: Int!
    reviewPublished: Int!
    liveHosted: Int!
  }

  type AdminUser {
    username: ID!
    email: String!
    status: String!
    enabled: Boolean!
    createdAt: String!
  }

  type Mutation {
    # Host
    startSession(tastingId: ID!, pacing: String!, visibility: String!): TastingSession!
    advanceSession(sessionId: ID!, step: Int!, status: String): TastingSession!
    # Guest (no account)
    joinSession(joinCode: String!, displayName: String!): Participant!
    submitRating(input: RatingInput!): Rating!
    answerQuiz(sessionId: ID!, participantId: ID!, questionId: ID!, choiceIndex: Int!, correct: Boolean!, ms: Int!): Boolean!
    track(name: String!, path: String): Boolean!
    # Account
    upsertReview(input: ReviewInput!): Review!
    # Pipeline trigger (image already uploaded to S3)
    recognizeBottle(imageKey: String!): Bottle
    # Tequila assistant (history is a JSON string of prior turns)
    askChat(message: String!, history: String): String!
    sendInvite(joinCode: String!, email: String, phone: String): Boolean!
    sendRecap(email: String, phone: String, subject: String, html: String, text: String): Boolean!
    presignUpload(bottleId: ID!, contentType: String!): UploadTarget!
    setBottleImage(bottleId: ID!, imageUrl: String!): Bottle!
    moderateReview(bottleId: ID!, userId: ID!): ModerationResult!
    setReviewModeration(bottleId: ID!, userId: ID!, decision: String!): Review!
    adminUserAction(username: String!, action: String!): Boolean!
    saveMyTasting(input: TastingEntryInput!): TastingEntry!
    deleteMyTasting(id: String!): Boolean!
    setFavorite(bottleId: String!, favorited: Boolean!): Boolean!
    saveMyReminder(input: ReminderInput!): Reminder!
    deleteMyReminder(id: String!): Boolean!
  }

  type UploadTarget {
    uploadUrl: String!
    key: String!
    publicUrl: String!
  }

  type Subscription {
    onSessionAdvanced(sessionId: ID!): TastingSession
      @aws_subscribe(mutations: ["advanceSession"])
    onParticipantJoined(sessionId: ID!): Participant
      @aws_subscribe(mutations: ["joinSession"])
    onRatingSubmitted(sessionId: ID!): Rating
      @aws_subscribe(mutations: ["submitRating"])
  }
`;
