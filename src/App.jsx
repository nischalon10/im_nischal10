import { useState } from "react";
import "./App.css";
import commands from "./data.json";

function App() {
  const [cmd, setCmd] = useState("");
  const [output, setOutput] = useState({});
  
  function submit(e) {
    e.preventDefault();
    if (cmd.toLowerCase() === "clear") {
      setOutput({});
    } else if (cmd.toLowerCase() === "exit"){
      window.close();
    } else if (cmd.toLowerCase() === "resume"){
      window.open("google.com");
    }
    else if (cmd.toLowerCase() === "boomer"){
      window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    }
    else{
      const command = commands.find(c => c.name === cmd.toLowerCase());
      setOutput(command || { name: `command not found: ${cmd}`, description:"type `help` to see all available commands."})
    }
    setCmd("");
  }

  return (
    <>
      <form>
        <span className="prompt">
          <span className="ask">ask</span>
          <span className="@">@</span>
          <span className="nischal">nischal</span>
          <span className=":">:</span>
          <span className="~">~</span>
          <span className="$">$</span>
        </span>
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          autoFocus="true"
          placeholder="help"
        />
        <button
          type="submit"
          onClick={submit}
          hidden
        >
        </button>
      </form>
      <div className="output">
        <h2 className="Name">
          {output.name}
        </h2>
        <div className="command-container">
        {output.links && output.links.map((l, i) => (
          <a key={i} className="left" href={l.url}>{l.name}</a>
        ))}
        </div>
        <h3 className="Description">{output.description}</h3>
        {output.commands && output.commands.map((c, i) => (
          <div key={i} className="command-container">
            <span className="left">{c.cmdName}</span>
            <span className="right">{c.description}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
