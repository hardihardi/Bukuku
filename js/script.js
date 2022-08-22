const filterTabButtons = document.querySelectorAll(".tab-item .btn");
const addBookForm = document.querySelector("#addBookForm");
const allBooksDivContainer = document.querySelector("#allBooks");
const unCompletedBooksContainer = document.querySelector("#unCompletedBooks");
const completedBooksContainer = document.querySelector("#completedBooks");
const modalEditBook = document.querySelector("#modalEditBook");
const closeModalBookBtn = document.querySelector("#closeModalBook");
const editBookForm = document.querySelector("#editBookForm");
const inputKeywordBook = document.querySelector("#inputKeywordBook");

const books = JSON.parse(localStorage.getItem("bookshelf")) ?? [];
let keyword = "";

filterTabButtons.forEach((tabBtn) => {
  tabBtn.addEventListener("click", handleClickTab);
});

function handleClickTab(event) {
  const currentActiveTabBtn = document.querySelector(".tab-item .btn.active");
  currentActiveTabBtn?.classList.remove("active");
  this.classList.add("active");

  const { target } = event.target.dataset;
  const tabPane = document.querySelector(`${target}`);
  const currentActiveTabPane = document.querySelector(
    ".filter-section .tab-pane.active"
  );
  currentActiveTabPane?.classList.remove("active");
  tabPane.classList.add("active");
  populateBooks();
}

function addBookHandler(event) {
  event.preventDefault();

  const title = addBookForm["title"].value;
  const author = addBookForm["author"].value;
  const year = addBookForm["year"].value;
  const isCompleted = addBookForm["isCompleted"].checked;

  const newBook = {
    id: +new Date(),
    title,
    author,
    year,
    isCompleted,
  };

  const invalidFeedbackTitle = addBookForm["title"]
    .closest(".form-control")
    .querySelector(".invalid-feedback");

  if (isBookTitleExist(title)) {
    addBookForm["title"].classList.add("invalid");
    invalidFeedbackTitle.textContent = "Judul buku sudah ada!";
    invalidFeedbackTitle.style.display = "block";
    return;
  }

  books.unshift(newBook);
  localStorage.setItem("bookshelf", JSON.stringify(books));
  populateBooks();
  addBookForm["title"].classList.remove("invalid");
  invalidFeedbackTitle.textContent = "";
  invalidFeedbackTitle.style.display = "none";
  addBookForm.reset();

  // Show alert success
  Swal.fire({
    icon: "success",
    title: "Berhasil ditambahkan 👍",
    html: `<p>Buku <span style="color: #0d6efd;">${title}</span> berhasil ditambahkan ke rak ${
      isCompleted ? "selesai dibaca!" : "belum selesai dibaca!</p>"
    }`,
  });
}

function editBookHandler(event) {
  event.preventDefault();

  const bookId = editBookForm["bookId"].value;
  const title = editBookForm["editTitle"].value;
  const author = editBookForm["editAuthor"].value;
  const year = editBookForm["editYear"].value;
  const isCompleted = editBookForm["editIsCompleted"].checked;

  const book = findBookById(bookId);

  const invalidFeedbackTitle = editBookForm["editTitle"]
    .closest(".form-control")
    .querySelector(".invalid-feedback");

  if (isBookTitleExist(title) && title !== book.title) {
    editBookForm["editTitle"].classList.add("invalid");
    invalidFeedbackTitle.textContent = "Judul buku sudah ada!";
    invalidFeedbackTitle.style.display = "block";
    return;
  }

  book.title = title;
  book.author = author;
  book.year = year;
  book.isCompleted = isCompleted;

  localStorage.setItem("bookshelf", JSON.stringify(books));

  editBookForm["editTitle"].classList.remove("invalid");
  invalidFeedbackTitle.textContent = "";
  invalidFeedbackTitle.style.display = "none";

  closeModalEdit();
  populateBooks();
  // Show alert success
  Swal.fire({
    title: "Berhasil diedit 👍",
    icon: "success",
  });
}

function toggleCompletedBook(bookId) {
  const book = findBookById(bookId);
  if (!book) return;

  const message = book.isCompleted
    ? "Tandai belum selesai dibaca?"
    : "Tandai sudah selesai dibaca?";

  // Show confirm dialog
  Swal.fire({
    title: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Batal",
    reverseButtons: true,
  }).then((result) => {
    if (result.isConfirmed) {
      book.isCompleted = !book.isCompleted;
      localStorage.setItem("bookshelf", JSON.stringify(books));
      populateBooks();
      Swal.fire(
        "Berhasil ditandai 👍",
        `Buku ${book.title} berhasil di${message
          .charAt(0)
          .toLowerCase()}${message.slice(1, -1)}.`,
        "success"
      );
    }
  });
}

function deleteBook(bookId) {
  const indexOfBook = books.findIndex((book) => book.id == bookId);
  const bookToDelete = findBookById(bookId);

  if (indexOfBook === -1) return;

  // Show confirm dialog
  Swal.fire({
    title: "Apakah kamu yakin?",
    text: `Kamu mau menghapus buku ${bookToDelete.title}.`,
    icon: "warning",
    showCancelButton: true,
    cancelButtonText: "Batal",
    confirmButtonText: "Ya, Hapus!",
    reverseButtons: true,
    customClass: {
      cancelButton: "btn-secondary",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      books.splice(indexOfBook, 1);
      localStorage.setItem("bookshelf", JSON.stringify(books));
      populateBooks();
      Swal.fire(
        "Berhasil dihapus 👍",
        `Buku ${bookToDelete.title} berhasil dihapus.`,
        "success"
      );
    }
  });
}

function updateEditBookForm(bookId) {
  const { id, title, author, year, isCompleted } = findBookById(bookId);

  editBookForm["bookId"].value = id;
  editBookForm["editTitle"].value = title;
  editBookForm["editAuthor"].value = author;
  editBookForm["editYear"].value = year;
  editBookForm["editIsCompleted"].checked = isCompleted;

  showModalEdit();
}

function findBookById(bookId) {
  return books.find((book) => book.id == bookId);
}

function isBookTitleExist(bookTitle) {
  return books.some(
    (book) => book.title.trim().toLowerCase() === bookTitle.trim().toLowerCase()
  );
}

function populateBooks() {
  allBooksDivContainer.innerHTML = "";
  unCompletedBooksContainer.innerHTML = "";
  completedBooksContainer.innerHTML = "";

  const bookList = books.filter((book) =>
    book.title.toLowerCase().includes(keyword)
  );

  const isFoundUnCompletedBooks = bookList.some(
    (book) => book.isCompleted === false
  );

  const isFoundCompletedBooks = bookList.some((book) => book.isCompleted);

  if (bookList.length === 0 && keyword) {
    allBooksDivContainer.innerHTML = renderNoResultFound();
    completedBooksContainer.innerHTML = renderNoResultFound();
    unCompletedBooksContainer.innerHTML = renderNoResultFound();
    return;
  }

  bookList.forEach((book) => {
    allBooksDivContainer.appendChild(createBookCard(book));

    if (!isFoundUnCompletedBooks && keyword) {
      unCompletedBooksContainer.innerHTML = renderNoResultFound();
    }

    if (!isFoundCompletedBooks && keyword) {
      completedBooksContainer.innerHTML = renderNoResultFound();
    }

    if (book.isCompleted) {
      completedBooksContainer.appendChild(createBookCard(book));
    } else {
      unCompletedBooksContainer.appendChild(createBookCard(book));
    }
  });
}

function createBookCard(book) {
  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card");
  bookCard.innerHTML = `
    <h3 class="title">${book.title}</h3>
    <p class="label">
      Penulis : <span class="author">${book.author}</span>
    </p>
    <p class="label">Tahun : <span class="year">${book.year}</span></p>
    <div class="actions">
      <button class="btn btn-danger btn-sm" title="Hapus Buku" data-id="${
        book.id
      }" onclick="deleteBook(this.dataset.id)">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          class="icon"
        >
          <path
            d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h2V6h-4V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H3v2h2zM9 4h6v2H9zM8 8h9v12H7V8z"
          ></path>
          <path d="M9 10h2v8H9zm4 0h2v8h-2z"></path>
        </svg>
      </button>
      <button class="btn btn-primary btn-sm" title="Edit Buku" data-id="${
        book.id
      }" onclick="updateEditBookForm(this.dataset.id)">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          class="icon"
        >
          <path
            d="m18.988 2.012 3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287-3-3L8 13z"
          ></path>
          <path
            d="M19 19H8.158c-.026 0-.053.01-.079.01-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2V19z"
          ></path>
        </svg>
      </button>
      <button class="btn ${
        book.isCompleted ? "btn-dark" : "btn-success"
      } btn-sm" title="${
    book.isCompleted
      ? "Tandai belum selesai dibaca"
      : "Tandai sudah selesai dibaca"
  }" data-id="${book.id}" onclick="toggleCompletedBook(this.dataset.id)">
        ${
          book.isCompleted
            ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" class="icon"><path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zm10.707-4.707-1.414 1.414L12 16.414l-2.293 2.293-1.414-1.414L10.586 15l-2.293-2.293 1.414-1.414L12 13.586l2.293-2.293 1.414 1.414L13.414 15l2.293 2.293zM5 7h14v2H5V7z"></path></svg>`
            : `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" class="icon">
              <path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zm6-3.586-3.707-3.707 1.414-1.414L11 15.586l4.293-4.293 1.414 1.414L11 18.414zM5 7h14v2H5V7z"></path>
            </svg>`
        }

      </button>
    </div>
  `;

  return bookCard;
}

function renderNoResultFound() {
  return `<h3 class="not-found">Tidak menemukan buku ${keyword}</h3>`;
}

function closeModalEdit() {
  const invalidFeedbackTitle = editBookForm["editTitle"]
    .closest(".form-control")
    .querySelector(".invalid-feedback");
  editBookForm["editTitle"].classList.remove("invalid");
  invalidFeedbackTitle.textContent = "";
  invalidFeedbackTitle.style.display = "none";
  modalEditBook.close();
  document.body.style.setProperty("overflow", "visible");
}

function showModalEdit() {
  modalEditBook.showModal();
  document.body.style.setProperty("overflow", "hidden");
}

function debounce(func, delay = 400) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

function handleSearchBook(query) {
  keyword = query.trim().toLowerCase();
  populateBooks();
}

const debouncedQuery = debounce(handleSearchBook);

populateBooks();
addBookForm.addEventListener("submit", addBookHandler);
editBookForm.addEventListener("submit", editBookHandler);
closeModalBookBtn.addEventListener("click", closeModalEdit);
inputKeywordBook.addEventListener("input", (e) =>
  debouncedQuery(e.target.value)
);
