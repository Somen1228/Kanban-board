import React, { useState } from "react";

function Navbar({ setSearchTerm }) {
  const [searchTerm, setSearchTermState] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTermState(value);
    setSearchTerm(value);
  };

  return (
    <div>
      <nav className="flex justify-between px-10 py-7 items-center">
        <h1 className="text-2xl text-gray-800 font-bold">
          
        </h1>
        <div className="flex items-center">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 pt-0.5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              className="ml-2 text-lg outline-none bg-transparent"
              type="text"
              name="search"
              id="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;