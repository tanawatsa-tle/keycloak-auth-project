<#import "social-providers.ftl" as identityProviders>

<#macro content>
  <#if pageId == "register" && social.providers??>
    <#list social.providers as provider>
      <#if provider.alias == "google">
        <#local signupProvider = {
          "alias": provider.alias,
          "providerId": provider.providerId,
          "displayName": provider.displayName,
          "iconClasses": provider.iconClasses!"",
          "loginUrl": properties.registrationUrl + "/google"
        }>
        <div id="kc-google-signup">
          <@identityProviders.show social={"providers": [signupProvider]} />
        </div>
        <#break>
      </#if>
    </#list>
  </#if>
  <script defer src="${url.resourcesPath}/js/registration.js"
          data-registration-url="${properties.registrationUrl}"></script>
</#macro>
