
//  Assuming the body from post request method:
//    bookDetails = {
//                      libraryId,title,author,ISBN,fileFormat
//                   }
//                      
//                      
//   
//  libraryId = name of the Library (VARCHAR)
//  title = name of the book (VARCHAR)
//  author = name of the writer (VARCHAR)
//  ISBN = Specific id or number of each book (no two books has same ISBN num)
//  fileFormat = File format of the ebook file (TEXT)
// 
// Note: For normal books(Non-ebooks) the fileFormat will be "" (empty string)
// 
// 
//  Assuming Database table:
//      library:
//          ____________________________________________________________
//         | library_id | title | author | isbn |is_ebook | file_format |
//         |            |       |        |      |         |             |
// 
// is_ebook = boolean value



const express = require("express");
const path = require("path");

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname,"exampledatabase.db");
// console.log(dbPath)

let db=null;

const intializeDbAndServer = async () => {
    try{
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
                    
        app.listen(4000, () => {
            console.log("lisenting to port 4000");
        })

    }
    catch(e){
        console.log(`DB Error: ${e.message}`)
        process.exit(1)
    }
}

intializeDbAndServer()



class Book {
        constructor(title, author, ISBN, libraryId) {
            this.title = title;
            this.author = author;
            this.isbn = ISBN;
            this.libraryId = libraryId;
           
        }
    
        displayInfo() {
        console.log(`
        Title: ${this.title},
        Author: ${this.author},
        ISBN: ${this.isbn},
        Library Id: ${this.libraryId}
        `)
        }
    }
    
    class EBook extends Book {
        constructor(title, author, ISBN,libraryId, fileFormat) {
            super(title, author, ISBN,libraryId);
            this.fileFormat = fileFormat
        }
     
        displayInfo() {
        console.log(`
        Title: ${this.title},
        Author: ${this.author},
        ISBN: ${this.isbn},
        Library Id: ${this.libraryId},
        File Format: ${this.fileFormat}
        `)
        }
    }

class Library {
    constructor() {
        this.books = [];
    }
    addBook(book) {
        const [title, author, ISBN, libraryId,fileFormat] = book;
        // console.log(fileFormat)
        let newBook
        if (fileFormat === undefined){
            newBook = new Book(title, author, ISBN, libraryId)
        }
        else{
            newBook = new EBook(title, author, ISBN, libraryId,fileFormat)
        }
        this.books.push(newBook)
        // console.log(this.books)
     
    }
    displayBooks() {
       this.books.map((eachBook) => {
        // console.log(eachBook.fileFormat)
            eachBook.displayInfo()
       })

        
    }
    searchByTitle(title) {
        const getBook = this.books.find((eachItem) => eachItem.title.includes(title))
        getBook.displayInfo()
    }
}


const library1 = new Library()
library1.addBook(["titleA","authorA",123,"libraryA"]);
// console.log(library1)
library1.addBook(["titleB","authorB",1234,"libraryB","PDF"]);
// console.log(library1)

const library2 = new Library()
library2.addBook(["title1","author1",987,"library1"]);

library2.addBook(["title2","author2",9876,"library2","MP3"]);

// library1.displayBooks()
// library1.searchByTitle("titleA")

const book1 = new Book("titleZ","authorZ",444,"libraryZ")
// book1.displayInfo()

const ebook1 = new EBook("titleY","authorY",555,"libraryY","MP4")
// ebook1.displayInfo()


// Inserting Books provided into the Database table library
app.post('/addBook', async(req, res) => {
        // Got Book details from request Body
        const {bookDetails} = req.body;
        const {libraryId,title,author,isbn,fileFormat} = bookDetails;
      
        const isEbook= fileFormat === "" ? false : true

         const sqlEbookQuery = `
             INSERT INTO library(
                library_id,
                title,
                author,
                isbn,
                is_ebook,
                file_format
                )
             VALUES(
                "${libraryId}"
                 "${title}",
                 "${author}",
                 ${isbn},
                 ${isEbook},
                 "${fileFormat}"
             );
             `
             const dbResponse = await db.run(sqlEbookQuery)
             
            res.send(`Books inserted into Database Successful. The Book id is ${ dbResponse.lastID}`);
    });



// API call for getting All books
app.get('/listBooks', async(req, res) => {
        const sqlQuery = `
        SELECT 
            *
        FROM 
            library
        ORDER BY 
            library_id ASC;
        `
        const allBooks = await db.all(sqlQuery);
        res.send(allBooks)
    });



// API call for getting specific book
app.get("/library/:libraryId/books/:bookId",async (req,res) => {
    // ISBN is the bookId, so ignoring libraryId because each book has different ISBN no.
    const {bookId} = req.params
    try{
        const sqlQuery = `
                SELECT 
                    library_id,
                    title,
                    author,
                    isbn,
                    is_ebook
                FROM 
                    library
                WHERE isbn = ${bookId};
                `
                const requestedBook = await db.get(sqlQuery);
                res.send(requestedBook)
    }
    catch(e){
        console.log(`Db Error: Requested Book ${bookId} does not exist`); 
    }
})


// API call for getting specific Ebook
app.get("/library/:libraryId/ebooks/:ebookId", async(req,res) => {
    // ISBN is the ebookId, so ignoring libraryId because each book has different ISBN no.
    const {ebookId} = req.params
    try{
        const sqlQuery = `
        SELECT 
            *
        FROM 
            library
        WHERE isbn = ${ebookId};
        `
        const requestedEbook = await db.get(sqlQuery);
        res.send(requestedEbook)
    }
    catch(e){
        console.log(`Db Error: Requested Ebook ${ebookId} does not exist`);

    }

})

// API call for searching a book 
app.get("library/:libraryId/books/?search_q=search", async(req,res) => {
    // Got requested title from query parameters
    const {search_q} = req.query;
    try{
    const sqlQuery = `
    SELECT
         *
    FROM 
        library
    WHERE 
        title LIKE "%${search_q}%"
    `;
    const searchedBook = await db.get(sqlQuery);
    res.send(searchedBook)
}catch(e){
    console.log(`Searched Book ${search_q} is not Avaliable`);
}

})


// API call for searching a Ebook 
app.get("library/:libraryId/ebooks/?search_q=search", async(req,res) => {
     // Got requested title from query parameters
    const {search_q} = req.query;
    try{
    const sqlEbookQuery = `
    SELECT
         *
    FROM 
        library
    WHERE 
        title LIKE "%${search_q}%"
    `;
    const searchedEbook = await db.get(sqlEbookQuery);
    res.send(searchedEbook)
}catch(e){
    console.log(`Searched Ebook ${search_q} is not Avaliable`);
}

})

// API call for Deleting a Book from library table
app.delete('/deleteBook/:bookId', async (req, res) => {
    // Got Book id from path parameters
    const  {bookId} = req.params
    const delSqlQuery = `
    DELETE FROM 
        library
    WHERE 
        isbn = ${bookId}
    `;
    await db.run(delSqlQuery);
    res.send(`Book id ${bookId} Deleted`);

    });




