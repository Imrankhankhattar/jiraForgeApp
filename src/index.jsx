const fetch = require('node-fetch');
import ForgeUI, { render, Fragment, Text, IssuePanel, useProductContext, useState, useEffect, Separator, TableBody, Head, Row, Cell, Table, TableHeader, TableRow, TableCell } from "@forge/ui";
import api, { route } from "@forge/api";
var boardId = 1125

const fetchCommentsForIssue = async (issueId) => {
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue/${issueId}/comment`);

  const data = await res.json();
  return data.comments;
};
async function getActiveSprint() {

  const res = await api.asUser().requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=active`);
  const activeSprints = await res.json();
  return activeSprints.values[0];
}
async function getIssuesBySprint(sprintId) {
  console.log(sprintId, boardId);
  // const res = await api.asUser().requestJira(route`rest/agile/1.0/board/${boardId}/sprint/${sprintId}/issue`);
  const res = await api.asUser().requestJira(route`/rest/api/3/search?jql=sprint=${sprintId}`);
  const issues = await res.json();
  const modified_issues = [];
  issues.issues.map(
    async (issue) => {
      let issueSample = {};
      // console.log(issue.fields.timeoriginalestimate,issue.fields.progress);
      issueSample.id = issue['id'];
      issueSample.status = issue['fields']['status']['name'];
      issueSample.summary = issue['fields']['summary'];
      issueSample.assignee = issue.fields?.assignee?.displayName;
      issueSample.priority = issue['fields']['priority']['name'];
      issueSample.issuetype = issue['fields']['issuetype']['name'];
      issueSample.created = issue['fields']['created'];
      issueSample.updated = issue['fields']['updated'];
      issueSample.duedate = issue['fields']['duedate'];
      issueSample.description = issue['fields']['description'];
      issueSample.labels = issue['fields']['labels'];
      issueSample.progress = issue['fields']['progress'];
      modified_issues.push(issueSample);

    }
  );
  return modified_issues;

}
function getDistinctAssigneeList(issues) {
  let assigneeList = [];
  issues.map(
    async (issue) => {
      if (issue.assignee && !assigneeList.includes(issue.assignee)) {
        assigneeList.push(issue.assignee);
      }
    }
  );


  return assigneeList;
}
function preparedSprintData(sprint) {
  let sprintData = {};
  const days = Math.round((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24));;
  sprintData.sprintDays = days - ((days / 7) * 2);
  sprintData.workingHours = 8;
  sprintData.capacity = sprintData.sprintDays * sprintData.workingHours;
  return sprintData;
}
function getPreparedData(issues, assigneeList) {
  let preparedData = [];
  assigneeList.map(
    async (assignee) => {
      let assigneeData = {};
      assigneeData.assignee = assignee;
      assigneeData.toDo = 0;
      assigneeData.inProgress = 0;
      assigneeData.done = 0;
      assigneeData.estimatedTime = 0;
      assigneeData.spentTime = 0;
      assigneeData.reqET = 0;
      issues.map(
        async (issue) => {
          if (issue.assignee == assignee) {
            if (issue.status == 'To Do') {
              assigneeData.toDo++;
            }
            if (issue.status == 'In Progress') {
              assigneeData.inProgress++;
            }
            if (issue.status == 'Done') {
              assigneeData.done++;
            }
            assigneeData.estimatedTime += issue.progress.total;
            assigneeData.spentTime += issue.progress.progress;
            assigneeData.reqET += issue.progress.total - parseInt(issue.progress.progress);
          }
        }
      );
      preparedData.push(assigneeData);

    }
  );
  let total = {
    totalToDo: 0,
    totalInProgress: 0,
    totalDone: 0,
    totalEstimatedTime: 0,
    totalSpentTime: 0,
    totalProgress: 0,
    totalCapacity: 0,
    totalForecasting: 0,
    totalReqET: 0,
  };
  preparedData.map(
    async (assigneeData) => {
      total.totalToDo += assigneeData.toDo;
      total.totalInProgress += assigneeData.inProgress;
      total.totalDone += assigneeData.done;
      total.totalEstimatedTime += assigneeData.estimatedTime;
      total.totalSpentTime += assigneeData.spentTime;
    }
  );
  total.totalProgress = total.totalSpentTime / total.totalEstimatedTime;
  total.totalCapacity = total.totalEstimatedTime / 8;
  total.totalForecasting = total.totalCapacity - total.totalInProgress;
  total.totalReqET = total.totalEstimatedTime - total.totalSpentTime;
  return [preparedData, total];
}

const App = () => {
  const context = useProductContext();
  const [sprint] = useState(async () => await getActiveSprint());
  const [sprintIssues] = useState(async () => await getIssuesBySprint(sprint.id));
  const [assigneeList] = useState(async () => await getDistinctAssigneeList(sprintIssues));
  const [preparedData] = useState(async () => await getPreparedData(sprintIssues, assigneeList, sprint));
  const [comments] = useState(async () => await fetchCommentsForIssue(context.platformContext.issueId));
  let sprintDetails = preparedSprintData(sprint);

  return (
    <Table>
      <Head>
        <Cell>
          <Text>Resource Name</Text>
        </Cell>
        <Cell>
          <Text>Allocation</Text>
        </Cell>
        <Cell>
          <Text>Progress</Text>
        </Cell>
        <Cell>
          <Text>Req.ET</Text>
        </Cell>
        <Cell>
          <Text>Forecasting</Text>
        </Cell>
        <Cell>
          <Text>Capacity</Text>
        </Cell>
        <Cell>
          <Text>Open</Text>
        </Cell>
        <Cell>
          <Text>In Progress</Text>
        </Cell>
        <Cell>
          <Text>Done</Text>
        </Cell>
      </Head>
      {preparedData[0].map(issue => (
        <Row>
          <Cell>
            <Text>{issue.assignee}</Text>
          </Cell>
          <Cell>
            <Text>{parseInt(issue.estimatedTime) / 60 / 60}</Text>
          </Cell>
          <Cell>
            <Text>{parseInt(issue.spentTime) / 60 / 60}</Text>
          </Cell>
          <Cell>
            <Text>{(issue.reqET) / 60 / 60}</Text>
          </Cell>
          <Cell>
            <Text></Text>
          </Cell>
          <Cell>
            <Text></Text>
          </Cell>
          <Cell>
            <Text>{issue.toDo}</Text>
          </Cell>
          <Cell>
            <Text>{issue.inProgress}</Text>
          </Cell>
          <Cell>
            <Text>{issue.done}</Text>
          </Cell>
        </Row>
      ))}
      <Row>
        <Cell>
          <Text >Total</Text>
        </Cell>
        <Cell>
          <Text>{(preparedData[1].totalEstimatedTime) / 60 / 60}</Text>
        </Cell>
        <Cell>
          <Text>
            {(preparedData[1].totalSpentTime) / 60 / 60}
          </Text>
        </Cell>
        <Cell>
          <Text>
            {(preparedData[1].totalReqET) / 60 / 60}
          </Text>
        </Cell>
        <Cell>
          <Text>
            {(preparedData[1].totalForecasting) / 60 / 60}
          </Text>
        </Cell>
        <Cell>
          <Text>
            {(preparedData[1].totalCapacity) / 60 / 60}
          </Text>
        </Cell>
        <Cell>
          <Text>
            {preparedData[1].totalToDo}
          </Text>
        </Cell>
        <Cell>
          <Text>
            {preparedData[1].totalInProgress}
          </Text>
        </Cell>
        <Cell>
          <Text>
            {preparedData[1].totalDone}
          </Text>
        </Cell>
      </Row>

      {/* {
    totalToDo: 0,
    totalInProgress: 1,
    totalDone: 0,
    totalEstimatedTime: 629100,
    totalSpentTime: 251100,
    totalProgress: 0.39914163090128757,
    totalCapacity: 78637.5,
    totalForecasting: 78636.5,
    totalReqET: 378000
  } */}

    </Table>
  );
};

export const run = render(
  <IssuePanel>
    <App />
  </IssuePanel>
);
