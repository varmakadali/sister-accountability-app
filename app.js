let tasks = [];


function addTask() {

    const input = document.getElementById("taskInput");

    const taskText = input.value.trim();

    if (taskText === "") {
        alert("Please enter a task!");
        return;
    }

    tasks.push({
        text: taskText,
        completed: false
    });

    input.value = "";

    displayTasks();
}


function completeTask(index) {

    tasks[index].completed = !tasks[index].completed;

    displayTasks();
}


function displayTasks() {

    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";


    tasks.forEach((task, index) => {

        const taskDiv = document.createElement("div");

        taskDiv.className = "task";


        if (task.completed) {

            taskDiv.classList.add("completed");

        }


        taskDiv.innerHTML = `

            <span>
                ${task.text}
            </span>

            <button onclick="completeTask(${index})">

                ${task.completed ? "Undo" : "Complete"}

            </button>

        `;


        taskList.appendChild(taskDiv);

    });


    updateProgress();
}


function updateProgress() {

    const progressElement =
        document.getElementById("progress");


    if (tasks.length === 0) {

        progressElement.innerText =
            "Progress: 0%";

        return;
    }


    const completed =
        tasks.filter(task => task.completed).length;


    const percentage =
        Math.round((completed / tasks.length) * 100);


    progressElement.innerText =
        `Progress: ${percentage}%`;
}