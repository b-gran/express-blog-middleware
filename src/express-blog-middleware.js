import _ from 'lodash';

// Web server framework
import express from 'express';

// Post rendering
import fm from 'front-matter';
import marked from 'marked';
import pug from 'pug';

// Filesystem stuff
import fs from 'fs';
import path from 'path';

/**
 * Extracts the frontmatter from the file specified by `path`.
 * Returns whatever the frontmatter call returned.
 *
 * @param {string} path - the path to the file
 */
function extractFM (path) {
    const raw = fs.readFileSync(path);
    return fm(raw.toString());
}

/**
 * Returns a function that extracts the frontmatter from a
 * file (specified by a path) and parses the body of
 * the file using `parser`
 *
 * The function returned by createParser has signature
 *
 *      function parse (path: String, ...args) -> Object
 *
 * and it will return
 *
 *  {
 *      attributes: {
 *          ... front matter
 *      },
 *
 *      body: raw post body,
 *
 *      frontmatter: raw front matter,
 *
 *      html: parsed file as html string
 * };
 *
 * @param {function} parser - parser to use. Gets called like this: parser(fileContent, arg0, arg1, ..., argN)
 * @param {any} [thisArg] - what to use for this when calling the parser
 */
function createParser (parser, thisArg = null) {
    return (path, ...args) => {
        const content = extractFM(path);
        return {
            ...content,
            html: parser.apply(thisArg, [ content.body, ...args ]),
        }
    };
}

/**
 * The filetypes supported by express-blog-middleware.
 */
export const FILE_FORMATS = [ 'md', 'markdown', 'pug', 'jade' ];

/**
 * The parser used by each of the supported filetypes.
 */
export const PARSERS = {
    md: createParser(marked),
    markdown: createParser(marked),
    pug: createParser(pug.render, pug),
    jade: createParser(pug.render, pug),
}

/**
 * Tries to retrieve the content for the post with filename `postPath`.
 *
 * @param {string} postPath - the post's filename
 */
function fetchPost (postPath) {
    // Raw post data
    const raw = fs.readFileSync(postPath);

    // Extract title, etc.
    const content = fm(raw);
}

/**
 * Searches postDirectory for any file with a postName as its base name.
 *
 * If a file has postName and any of the legal file formats, this post will
 * return the file's name, directory, extension, and path.
 *
 * @param {string} postDirectory - directory to search for posts
 * @param {string} postName - name of the post to search for
 */
function getPostMeta (postDirectory, postName) {
    return FILE_FORMATS
        // Test all legal file formats
        .map(type => path.format({
            dir: postDirectory,
            file: postName,
            ext: `.${type}`,
        })

        // Find which (if any) exist
        .filter(postPath => fs.existsSync(postPath)))

        // Return the first existing file, or false if none exist
        .reduce(
            (memo, postPath) => {
                return (
                    memo ||
                    {
                        name: postName,
                        directory: postDirectory,
                        extension: path.extname(postPath),
                        path: postPath,
                    }
                );
            },
            false
        );
}

/**
 * options {
 *      // Path to the posts directory
 *      // Required
 *      postsDirectory: String,
 *
 *      // Path to the pug template for a single post
 *      // Default: uses express-blog-middleware's default template
 *      [post]: String,
 *
 *      // Path to the pug template for a page of posts
 *      // Default: uses express-blog-middleware's default template
 *      [page]: String,
 *
 *      // Number of posts to display per page
 *      // Default: 10
 *      [postsPerPage]: Number,
 * }
 */
function blog (opts= {}) {
    if (!opts.postsDirectory) {
        throw new Error('You must supply `postsDirectory` in the options.');
    }

    // Options & defaults
    const options = {
        postsDirectory: opts.postsDirectory,
        post: opts.post || path.join(__dirname, 'post.pug'),
        page: opts.page || path.join(__dirname, 'page.pug'),
        postsPerPage: opts.postsPerPage || 10,
    };

    // Create a router
    const router = express.Router();

    // Main blog view
    // The page (1-indexed) can be specified in the query string
    //
    //      e.g. //server:3000/?page=1
    router.get('/', (req, res, next) => {
        // The page of posts to display
        const page = Math.max(1, req.query.page || 1) - 1;
        const firstIndex = page * options.postsPerPage;

        // Posts for this page
        const posts = _.flow(
            // Sort by post creation date descending
            posts => _.sortBy(
                posts,
                post => -(
                    new Date(
                        post.attributes.date ||
                        Date.now()
                    ).getTime()
                )
            ),

            // Limit according to options and page
            posts => _.slice(
                posts,
                Math.min(posts.length, firstIndex),
                Math.min(posts.length, firstIndex + options.postsPerPage)
            )
        )(
            fs.readdirSync(options.postsDirectory)
            // Get all files in posts directory with a valid extensions
                .filter(filename => _.includes(FILE_FORMATS, ext(filename)))

                // Parse all files
                .map(filename => {
                    return PARSERS[ext(filename)](path.join(options.postsDirectory, filename));
                }),
        );

        console.log(posts);

        // console.log(pug.renderFile(options.page, { posts }));

        return res.status(200).send(pug.renderFile(options.page, { posts }));
    });

    return router;
}

/**
 * Gets the extension of a filename.
 * Removes the "." and makes the extension lower case
 *
 * @param {string} filename - the filename returned by path.filename() to clean up
 */
function ext (filename) {
    return path.extname(filename).toLowerCase().replace('.', '');
}

export default blog;
