# `express-blog-middleware`

Dead simple blogging middleware for the Express framework.

Allows you to mount a blog anywhere in an existing Express app.
The posts are just `markdown` or `pug` files sitting in a directory
somewhere.

## Installing

```
npm install express-blog-middleware
```

## Usage

```
import express from 'express';
const app = express();

import blog from 'express-blog-middleware';

app.use('/blog', blog({
    postsDirectory: 'posts'
});
```

The blog middleware creates two routes:

### Main blog view

```
# A page of posts
GET /?page=N
```

For the above example, the URL `/blog/` would retrieve the main blog
view, which would display the first page of posts.

`/blog/?page=2` would display the second page of posts.

### Individual posts

```
# A particular post
GET /post/:postName
```

Each post is identified by its filename without the file extension.

So if the post `posts/` directory looks like this:

```
/posts/
----/post-1.md
----/post-2.markdown
----/post-3.pug
----/post-4.jade
----/post-5.MD
```

`/blog/post/post-2` would display the post `post-1.md` and 
`/blog/post/post-4` would display the post `post-4.jade`.

## Configuration

The `blog()` function takes a configuration parameter which accepts the
following options:

| Parameter | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| postsDirectory | String | `true` | | Path to the `posts` directory. |
| post | String | `false` | express-blog-middleware's default template | Path to a pug template to use for an __individual__ post |
| page | String | `false` | express-blog-middleware's default template | Path to a pug template to use for a __page__ of posts. Also used for the main page of the blog |
| postsPerPage | Number | `false` | 10 | Number of posts to display per page |
| blogURL | String | `false` | `/` | URL to the root of the blog. Used for direct links to posts |

Example (default options):

```
app.use('/blog', blog({
    postsDirectory: 'posts',
    post: 'post.pug',
    page: 'page.pug',
    postsPerPage: 10,
    blogURL: '/',
});
```

## Examples

See `/tools/startServer` for an example of a server with a blog mounted at `/`.