const postsRouter = require('./routes/posts');
const authRouter = require('./routes/auth');
const commentsRouter = require('./routes/comments');
const bookmarksRouter = require('./routes/bookmarks');

app.use('/api/posts', postsRouter);
app.use('/api/auth', authRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/bookmarks', bookmarksRouter); 