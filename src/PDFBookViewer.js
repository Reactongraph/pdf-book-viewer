import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import {
  FaTimes,
  FaSearchPlus,
  FaSearchMinus,
  FaBookmark,
} from "react-icons/fa";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFBookViewer = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [bookmarks, setBookmarks] = useState([]);
  const [scale, setScale] = useState(1.0);
  const [size, setSize] = useState();
  const flipBookRef = useRef(null);
  console.log("size====================>", size);
  useEffect(() => {
    setBookmarks([]);
    setPageNumber(1);
    setScale(1);
  }, [pdfUrl]);
  const BookPage = useCallback(
    (props) => {
      const { number, scale, width, height } = props || "";
      return (
        <Page
          size="A4"
          pageNumber={number}
          scale={scale}
          width={width}
          height={height}
          className="pdf-page"
        />
      );
    },
    [scale, size]
  );

  useEffect(() => {
    if (flipBookRef.current) {
      console.log(
        "flipBookRef ================>",
        flipBookRef.current.pageFlip()
      );
      // flipBookRef.current?.update();
      flipBookRef.current.pageFlip()?.ui.onResize();
    }
  }, [size]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }) => {
      setNumPages(numPages);
      pdfjs
        .getDocument(pdfUrl)
        .promise.then((pdf) => pdf.getPage(1))
        .then((page) => {
          const { width, height } = page.getViewport({ scale: 1 });
          const screenHeight = window.innerHeight - 100;
          const newWidth = (screenHeight / height) * width;
          setSize({
            width: newWidth,
            height: screenHeight,
            ratio: width / height,
          });
        })
        .catch((err) => console.log("Error getting page size:", err));
    },
    [pdfUrl]
  );

  const changeDimensions = useCallback(
    (reduction) => {
      if (!size) return;
      let scalingFactor = (size.width + reduction) / size.width;

      let newWidth = size.width * scalingFactor;
      let newHeight = size.height * scalingFactor;

      return {
        height: newHeight,
        width: newWidth,
      };
    },
    [size]
  );
  const gotoPage = (e) => {
    const page = Number(e.target.value);
    if (!page || page > numPages || page < 0) return;
    flipBookRef.current.pageFlip().flip(page - 1);
  };

  const nextPage = () => {
    flipBookRef.current.pageFlip().flipNext();
  };

  const prevPage = () => {
    flipBookRef.current.pageFlip().flipPrev();
  };

  const handlePageChange = (newPage) => {
    setPageNumber(newPage);
  };

  const onFlipPage = (newPage) => {
    setPageNumber(newPage.data + 1);
  };

  const zoomIn = () => {
    const { width, height } = changeDimensions(50);
    setSize((pre) => ({
      ...pre,
      width,
      height,
    }));
  };

  const zoomOut = () => {
    const { width, height } = changeDimensions(-50);
    if (width < 200 || height < 200) return;
    setSize((pre) => ({
      ...pre,
      width: width,
      height: height,
    }));
  };

  const goToBookmark = (page) => {
    flipBookRef.current.pageFlip().flip(page - 1);
  };

  const addToBookmarks = () => {
    if (pageNumber <= numPages && pageNumber + 1 <= numPages) {
      setBookmarks((pre) => [...new Set([...pre, pageNumber, pageNumber + 1])]);
    } else {
      setBookmarks((pre) => [...new Set([...pre, pageNumber])]);
    }
  };
  const { width, height } = changeDimensions(-100) || "";
  const renderPdf = useCallback(() => {
    return (
      <div>
        {size && (
          <HTMLFlipBook
            key={`${width}-${height}`}
            width={width}
            height={height}
            onChangePage={handlePageChange}
            onFlip={onFlipPage}
            className="html-flipbook"
            ref={flipBookRef}
            // autoSize={true}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} className="page-container">
                <BookPage
                  number={index + 1}
                  // scale={scale}
                  width={width}
                  height={height}
                />
              </div>
            ))}
          </HTMLFlipBook>
        )}
      </div>
    );
  }, [size, scale, pdfUrl]);
  return (
    <div className="pdf-main-container">
      {bookmarks.length > 0 && (
        <div className="bookmark-sidebar">
          <h3>Bookmarks:</h3>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            showToolbar={true}
          >
            {bookmarks.map((bookmark, index) => (
              <div
                key={index}
                style={{
                  cursor: "pointer",
                  marginBottom: "10px",
                  position: "relative",
                }}
              >
                Page {bookmark}
                <span
                  className="close-icon"
                  onClick={() => {
                    setBookmarks(bookmarks?.filter((_, ind) => ind !== index));
                  }}
                >
                  <FaTimes size={"12px"} />
                </span>
                <div onClick={() => goToBookmark(bookmark)}>
                  <Page
                    size="A4"
                    pageNumber={bookmark}
                    width={100}
                    height={100}
                    className="pdf-page"
                  />
                </div>
              </div>
            ))}
          </Document>
        </div>
      )}
      <div className="pdf-col">
        <button
          onClick={prevPage}
          className="prev-icon"
          disabled={pageNumber <= 1}
        >
          &#10094;
        </button>
        <div className="pdf-file-container">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            showToolbar={true}
          >
            {renderPdf()}
          </Document>
        </div>
        <button
          onClick={nextPage}
          className="next-icon"
          disabled={pageNumber >= numPages}
        >
          &#10095;
        </button>
      </div>

      <div className="toolbar-control">
        <div>
          <span className="goto-text"> Go To:{" "}</span>
          <input
            type="number"
            defaultValue={pageNumber}
            onChange={gotoPage}
            min={1}
            max={numPages}
          />
        </div>
        <div className="bookmark-icon">
          <button onClick={() => addToBookmarks()}>
            <FaBookmark size={"12px"} />
            {/* 
            <svg fill="#000000" width="12px" height="12px" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
              <path d="M192,24H96A16.01833,16.01833,0,0,0,80,40V56H64A16.01833,16.01833,0,0,0,48,72V224a8.00026,8.00026,0,0,0,12.65039,6.50977l51.34277-36.67872,51.35743,36.67872A7.99952,7.99952,0,0,0,176,224V184.6897l19.35059,13.82007A7.99952,7.99952,0,0,0,208,192V40A16.01833,16.01833,0,0,0,192,24Zm0,152.45508-16-11.42676V72a16.01833,16.01833,0,0,0-16-16H96V40h96Z" />
            </svg> */}
          </button>
        </div>
        <div className="page-number">
          Page {pageNumber} of {numPages}
        </div>
        <div className="zoom-icon">
          <button onClick={zoomIn}>
            <FaSearchPlus size={"12px"} />
            {/* <svg fill="#000000" width="12px" height="12px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m14.88 16.56c-1.576 1.155-3.54 1.866-5.667 1.92h-.013c-.045.001-.098.001-.152.001-4.967 0-8.999-4.002-9.048-8.957v-.005-.24c0-5.125 4.155-9.28 9.28-9.28s9.28 4.155 9.28 9.28c-.04 2.142-.755 4.109-1.939 5.707l.019-.027 7.44 7.44-1.76 1.6zm-12.24-7.28c.023 3.716 3.041 6.72 6.76 6.72 3.734 0 6.76-3.027 6.76-6.76 0-.014 0-.028 0-.042v.002c0-.004 0-.01 0-.015 0-1.847-.766-3.515-1.998-4.703l-.002-.002c-1.221-1.235-2.915-2-4.788-2-3.718 0-6.732 3.014-6.732 6.732v.072zm5.92 3.733v-2.933h-2.96v-1.6h2.96v-2.906h1.6v2.906h2.88v1.6h-2.88v2.934z" /></svg> */}
          </button>
          <button onClick={zoomOut}>
            <FaSearchMinus size={"12px"} />
            {/* <svg width="12px" height="12px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">

              <title />

              <g id="Complete">

                <g id="zoom-out">

                  <g>

                    <circle cx="10.1" cy="10.1" fill="none" r="8" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />

                    <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="21.9" x2="16.3" y1="21.9" y2="16.3" />

                    <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="13.1" x2="7.1" y1="10.1" y2="10.1" />

                  </g>

                </g>

              </g>

            </svg> */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFBookViewer;
