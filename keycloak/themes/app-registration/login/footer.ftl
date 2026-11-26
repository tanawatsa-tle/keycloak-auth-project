<#import "social-providers.ftl" as identityProviders>

<#macro content>
  <#if pageId == "register" && social.providers??>
    <#local signupProviders = []>
    <#list social.providers as provider>
      <#if provider.alias == "google" || provider.alias == "microsoft">
        <#local signupProviders = signupProviders + [{
          "alias": provider.alias,
          "providerId": provider.providerId,
          "displayName": provider.displayName,
          "iconClasses": provider.iconClasses!"",
          "loginUrl": properties.registrationUrl?remove_ending("/") + "/" + provider.alias
        }]>
      </#if>
    </#list>
    <#if signupProviders?has_content>
      <div id="kc-social-signup">
        <@identityProviders.show social={"providers": signupProviders} />
      </div>
    </#if>
  </#if>
  <script defer src="${url.resourcesPath}/js/registration.js"
          data-registration-url="${properties.registrationUrl}"></script>
</#macro>
