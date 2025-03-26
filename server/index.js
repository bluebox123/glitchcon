const postsRouter = require('./src/routes/posts');
const authRouter = require('./src/routes/auth');
const commentsRouter = require('./src/routes/comments');
const bookmarksRouter = require('./src/routes/bookmarks');
const subscribersRouter = require('./src/routes/subscribers');

app.use('/api/posts', postsRouter);
app.use('/api/auth', authRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/subscribers', subscribersRouter); 