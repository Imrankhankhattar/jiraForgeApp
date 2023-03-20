import ForgeUI, { render, Fragment, Text, IssuePanel, useProductContext, useState, useEffect } from "@forge/ui";
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
    const username = uname;
    const password = pass;
    const url = 'https://pm-tkxel.atlassian.net/rest/agile/1.0/board/1125/sprint/3838/issue';
    
    const options = {
      headers: {
        Authorization: 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      }
    };
    
    fetch(url, options)
      .then(response => {
        if (response.ok) {
          console.log('',response)
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then(data => {
        console.log(data)
      })
      .catch(error => {
        console.error('There was a problem with the request:', error);
      });
    
  }

const App = () => {
  const context = useProductContext();
  
  const [sprint] = useState(async () => await getActiveSprint());
  const [sprintIssues] = useState(async () => await getIssuesBySprint(sprint.id));

  console.log('sprint details 000000000  =========>', sprintIssues);
  const [comments] = useState(async () => await fetchCommentsForIssue(context.platformContext.issueId));
  let com = comments[0]?.body?.content[0]?.content[0]?.text;

  return (
    <Fragment>
      <Text>{com === undefined ? 'No Comments' : com}</Text>
    </Fragment>
  );
};

export const run = render(
  <IssuePanel>
    <App />
  </IssuePanel>
);
