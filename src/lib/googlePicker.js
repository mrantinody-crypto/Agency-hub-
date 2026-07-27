export async function openGooglePicker(onPicked) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

  if (!clientId || !apiKey) {
    console.warn('Google picker is not configured yet.')
    return false
  }

  if (!window.google?.accounts?.oauth2 || !window.gapi?.load) {
    console.warn('Google API scripts are not available yet.')
    return false
  }

  return new Promise((resolve) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets.readonly',
      callback: async (response) => {
        if (response.error) {
          console.warn('Google picker access denied or cancelled.', response.error)
          resolve(false)
          return
        }

        const accessToken = response.access_token
        window.gapi.load('picker', {
          callback: () => {
            const picker = new window.google.picker.PickerBuilder()
              .addView(window.google.picker.ViewId.SPREADSHEETS)
              .addView(window.google.picker.ViewId.DOCUMENTS)
              .setOAuthToken(accessToken)
              .setDeveloperKey(apiKey)
              .setCallback(async (data) => {
                if (data.action === window.google.picker.Action.PICKED) {
                  const pickedFile = data.docs?.[0]
                  if (!pickedFile) {
                    resolve(false)
                    return
                  }

                  const payload = {
                    label: pickedFile.name,
                    url: pickedFile.url || `https://drive.google.com/file/d/${pickedFile.id}/view`,
                    resource_type: pickedFile.mimeType?.includes('spreadsheet') ? 'google_sheet' : 'google_doc',
                  }

                  try {
                    await onPicked(payload)
                    resolve(true)
                  } catch (error) {
                    console.error('Failed to save selected Google file.', error)
                    resolve(false)
                  }
                  return
                }

                resolve(false)
              })
              .build()

            picker.setVisible(true)
          },
          onerror: (error) => {
            console.error('Failed to load Google Picker.', error)
            resolve(false)
          },
        })
      },
    })

    tokenClient.requestAccessToken()
  })
}
