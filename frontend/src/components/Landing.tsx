import React from "react"
import { useState } from "react";
import { Link } from "react-router";


export const Landing = () => {
    const [name, setName] = useState<string>("");
    return <div>
        <input type="text" onChange={(e) => {setName(e.target.value)}}>
            
        </input>
        <Link to={`/room?name=${name}`}>Join Room</Link>
    </div>
}